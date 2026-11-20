import type { Source } from '../../modules/kanta-media/src/types';
import type { TrackKind } from '../db/tracks';

export type ParsedLink = { source: Source; kind: TrackKind; sourceId: string; link: string };

const URL_RE = /(spotify:[a-z]+:[A-Za-z0-9]+|https?:\/\/[^\s<>"']+)/g;

/** Finds the first Spotify / YouTube (Music) / Apple Music link inside shared text. */
export function parseMusicLink(text: string): ParsedLink | null {
  for (const m of text.matchAll(URL_RE)) {
    const p = parseOne(m[0].replace(/[).,!?]+$/, ''));
    if (p) return p;
  }
  return null;
}

function parseOne(raw: string): ParsedLink | null {
  const uri = raw.match(/^spotify:(track|album|playlist):([A-Za-z0-9]+)$/);
  if (uri) return spotify(uri[1] as TrackKind, uri[2]);

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  const parts = u.pathname.split('/').filter(Boolean);

  if (host === 'open.spotify.com') {
    const p = parts[0]?.startsWith('intl-') ? parts.slice(1) : parts;
    if ((p[0] === 'track' || p[0] === 'album' || p[0] === 'playlist') && p[1]) return spotify(p[0], p[1]);
    return null;
  }

  if (host === 'music.youtube.com' || host === 'youtube.com') {
    if (parts[0] === 'watch') {
      const v = u.searchParams.get('v');
      return v ? ytTrack(v) : null;
    }
    if (parts[0] === 'playlist') {
      const list = u.searchParams.get('list');
      return list ? { source: 'ytmusic', kind: 'playlist', sourceId: list, link: `https://music.youtube.com/playlist?list=${list}` } : null;
    }
    if (parts[0] === 'browse' && parts[1]?.startsWith('MPREb')) {
      return { source: 'ytmusic', kind: 'album', sourceId: parts[1], link: `https://music.youtube.com/browse/${parts[1]}` };
    }
    return null;
  }
  if (host === 'youtu.be' && parts[0]) return ytTrack(parts[0]);

  if (host === 'music.apple.com') {
    const store = parts[0] && parts[0].length === 2 ? parts[0] : 'us';
    const rest = parts[0]?.length === 2 ? parts.slice(1) : parts;
    const songInAlbum = u.searchParams.get('i');
    if (rest[0] === 'album') {
      const albumId = rest[rest.length - 1];
      if (songInAlbum) return appleSong(store, songInAlbum);
      if (albumId && /^\d+$/.test(albumId)) {
        return { source: 'applemusic', kind: 'album', sourceId: albumId, link: `https://music.apple.com/${store}/album/${albumId}` };
      }
      return null;
    }
    if (rest[0] === 'song') {
      const id = rest[rest.length - 1];
      return id && /^\d+$/.test(id) ? appleSong(store, id) : null;
    }
    if (rest[0] === 'playlist') {
      const id = rest[rest.length - 1];
      return id?.startsWith('pl.')
        ? { source: 'applemusic', kind: 'playlist', sourceId: id, link: `https://music.apple.com/${store}/playlist/${id}` }
        : null;
    }
  }
  return null;
}

function spotify(kind: TrackKind, id: string): ParsedLink {
  return { source: 'spotify', kind, sourceId: id, link: `https://open.spotify.com/${kind}/${id}` };
}

function ytTrack(id: string): ParsedLink {
  return { source: 'ytmusic', kind: 'track', sourceId: id, link: `https://music.youtube.com/watch?v=${id}` };
}

function appleSong(store: string, id: string): ParsedLink {
  return { source: 'applemusic', kind: 'track', sourceId: id, link: `https://music.apple.com/${store}/song/${id}` };
}

/**
 * Builds a playable link from a media session's MEDIA_ID, when the app exposes one.
 * Formats confirmed so far: Spotify "spotify:track:<id>". Update from the Phase 0 results.
 */
export function linkFromMediaId(source: Source, mediaId: string): string | null {
  const id = sourceIdFromMediaId(source, mediaId);
  if (!id) return null;
  if (source === 'spotify') return `https://open.spotify.com/track/${id}`;
  if (source === 'ytmusic') return `https://music.youtube.com/watch?v=${id}`;
  return null;
}

export function sourceIdFromMediaId(source: Source, mediaId: string): string | null {
  if (source === 'spotify') return mediaId.match(/^spotify:track:([A-Za-z0-9]+)$/)?.[1] ?? null;
  // YouTube Music commonly uses the bare 11-character video id.
  if (source === 'ytmusic') return /^[A-Za-z0-9_-]{11}$/.test(mediaId) ? mediaId : null;
  return null;
}
