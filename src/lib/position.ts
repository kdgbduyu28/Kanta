import type { NowPlaying } from '../../modules/kanta-media/src/types';

/** Where the song is now, extrapolated from the last report while playing. */
export function positionNow(np: NowPlaying, now: number): number {
  const p = np.state === 'playing' ? np.positionMs + Math.max(0, now - np.positionAt) : np.positionMs;
  return np.durationMs > 0 ? Math.min(p, np.durationMs) : p;
}
