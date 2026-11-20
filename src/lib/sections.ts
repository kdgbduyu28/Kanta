import type { Source } from '../../modules/kanta-media/src/types';
import type { Play } from '../db/history';
import { t } from '../i18n';

export type HomeSection =
  | { kind: 'getStarted' }
  | { kind: 'recent'; plays: Play[] }
  | { kind: 'browse'; sources: Source[] };

const BROWSE_ORDER: Source[] = ['spotify', 'ytmusic', 'applemusic', 'local'];

/** What Home shows: a how-to when there is nothing yet, else Recently Played then Browse by source. */
export function homeSections(input: { recent: Play[]; sourcesWithSongs: Source[]; hasLocalFiles: boolean }): HomeSection[] {
  const sources = BROWSE_ORDER.filter(
    (s) => input.sourcesWithSongs.includes(s) || (s === 'local' && input.hasLocalFiles),
  );
  const out: HomeSection[] = [];
  if (input.recent.length) out.push({ kind: 'recent', plays: input.recent });
  if (sources.length) out.push({ kind: 'browse', sources });
  if (!out.length) out.push({ kind: 'getStarted' });
  return out;
}

export type LibraryTab = 'playlists' | 'songs' | 'artists' | 'albums';

export type EmptyInfo = { title: string; body: string; action?: 'newPlaylist' | 'sources' };

/** Message for an empty Library tab, or null when it has items. */
export function libraryEmptyState(tab: LibraryTab, counts: Partial<Record<LibraryTab, number>>): EmptyInfo | null {
  if ((counts[tab] ?? 0) > 0) return null;
  switch (tab) {
    case 'playlists':
      return {
        title: t('No playlists yet'),
        body: t('Make one and mix songs from any app.'),
        action: 'newPlaylist',
      };
    case 'songs':
      return {
        title: t('No songs yet'),
        body: t('Share a song from Spotify, YouTube Music or Apple Music to Kanta, or paste a link.'),
        action: 'sources',
      };
    case 'artists':
      return { title: t('No artists yet'), body: t('Artists appear here as you save songs.') };
    case 'albums':
      return { title: t('No albums yet'), body: t('Albums appear here as you save songs.') };
  }
}
