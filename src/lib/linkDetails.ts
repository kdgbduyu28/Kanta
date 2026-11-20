import type { ParsedLink } from './links';
import { sourceName } from './sources';
import { t } from '../i18n';

export type LinkDetails = {
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  durationMs: number;
};

type FetchFn = (url: string, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

const TIMEOUT_MS = 8000;

/** Title, artist and cover from the link's public page info. null when offline or unknown. */
export async function fetchLinkDetails(p: ParsedLink, fetchFn: FetchFn = fetch as unknown as FetchFn): Promise<LinkDetails | null> {
  try {
    if (p.source === 'ytmusic') {
      const watch = p.kind === 'track' ? `https://www.youtube.com/watch?v=${p.sourceId}` : p.link;
      const body = await get(fetchFn, `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`);
      return body ? fromYouTubeOEmbed(body) : null;
    }
    if (p.source === 'spotify' || p.source === 'applemusic') {
      const html = await get(fetchFn, p.link);
      if (!html) return null;
      return p.source === 'spotify' ? fromSpotifyPage(html) : fromApplePage(html);
    }
    return null;
  } catch {
    return null;
  }
}

async function get(fetchFn: FetchFn, url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetchFn(url, { signal: ctrl.signal, headers: { Accept: 'text/html,application/json' } });
    if (!r.ok) return null;
    return await r.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Reads <meta property|name="key" content="..."> in either attribute order. */
export function meta(html: string, key: string): string | null {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i').exec(html);
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, 'i').exec(html);
  const v = a?.[1] ?? b?.[1];
  return v != null ? decodeEntities(v) : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** "245" (seconds) or ISO "PT4M5S" → ms */
function durationMs(v: string | null): number {
  if (!v) return 0;
  if (/^\d+$/.test(v)) return Number(v) * 1000;
  const m = v.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);
  if (!m) return 0;
  return Math.round(((Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0)) * 60 + Number(m[3] ?? 0)) * 1000);
}

export function fromSpotifyPage(html: string): LinkDetails | null {
  const title = meta(html, 'og:title');
  if (!title) return null;
  // og:description: "Artist · Album · Song · 2000"
  const parts = (meta(html, 'og:description') ?? '').split(' · ');
  const isSong = parts.length >= 3 && /song/i.test(parts[2] ?? '');
  return {
    title,
    artist: meta(html, 'music:musician_description') ?? parts[0] ?? '',
    album: isSong ? (parts[1] ?? null) : null,
    artworkUrl: meta(html, 'og:image'),
    durationMs: durationMs(meta(html, 'music:duration')),
  };
}

export function fromYouTubeOEmbed(json: string): LinkDetails | null {
  const j = JSON.parse(json) as { title?: string; author_name?: string; thumbnail_url?: string };
  if (!j.title) return null;
  return {
    title: j.title,
    artist: (j.author_name ?? '').replace(/ - Topic$/, ''),
    album: null,
    artworkUrl: j.thumbnail_url ?? null,
    durationMs: 0,
  };
}

export function fromApplePage(html: string): LinkDetails | null {
  const og = meta(html, 'og:title');
  const appleTitle = meta(html, 'apple:title');
  // og:title: "Yellow by Coldplay on Apple Music"
  const m = og?.match(/^(.*) by (.*) on Apple(?: | )Music$/);
  const title = appleTitle ?? m?.[1] ?? og;
  if (!title) return null;
  return {
    title,
    artist: m?.[2] ?? '',
    album: null,
    artworkUrl: meta(html, 'og:image'),
    durationMs: durationMs(meta(html, 'music:song:duration') ?? meta(html, 'music:duration')),
  };
}

/** What a saved song shows until its details arrive. */
export function placeholderDetails(p: ParsedLink): LinkDetails {
  const what = p.kind === 'album' ? t('album') : p.kind === 'playlist' ? t('playlist') : t('song');
  return { title: `${sourceName(p.source)} ${what}`, artist: '', album: null, artworkUrl: null, durationMs: 0 };
}
