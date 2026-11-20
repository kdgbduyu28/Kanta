import type { Source, StreamingSource } from '../../modules/kanta-media/src/types';

export const SOURCES: Source[] = ['spotify', 'ytmusic', 'applemusic', 'local'];
export const STREAMING: StreamingSource[] = ['spotify', 'ytmusic', 'applemusic'];

export const PACKAGES: Record<StreamingSource, string> = {
  spotify: 'com.spotify.music',
  ytmusic: 'com.google.android.apps.youtube.music',
  applemusic: 'com.apple.android.music',
};

const NAMES: Record<Source, string> = {
  spotify: 'Spotify',
  ytmusic: 'YouTube Music',
  applemusic: 'Apple Music',
  local: 'On this phone',
};

/** Brand names stay as they are; only "On this phone" is translated where it is shown. */
export function sourceName(s: Source): string {
  return NAMES[s];
}

export function sourceForPackage(pkg: string): Source | null {
  for (const s of STREAMING) if (PACKAGES[s] === pkg) return s;
  return null;
}

export function playStoreUrl(s: StreamingSource): string {
  return `https://play.google.com/store/apps/details?id=${PACKAGES[s]}`;
}

export type SourceCardState = 'not-installed' | 'needs-access' | 'ready' | 'ready-remote';

/** What the Sources screen shows for one app. Local files need no notification access. */
export function sourceCardState(
  source: Source,
  installed: Source[],
  access: boolean,
  spotifyConnected: boolean,
): SourceCardState {
  if (source === 'local') return 'ready';
  if (!installed.includes(source)) return 'not-installed';
  if (!access) return 'needs-access';
  if (source === 'spotify' && spotifyConnected) return 'ready-remote';
  return 'ready';
}
