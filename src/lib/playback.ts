import * as Media from '../../modules/kanta-media';
import type { Track } from '../db/tracks';
import { t } from '../i18n';
import { toQueueItem } from '../store/library';
import { toast } from '../store/toast';
import { sourceName } from './sources';

/** Plays a list from `index` as Kanta's queue (songs without a link are skipped). */
export async function playTracks(tracks: Track[], index = 0, opts: { shuffle?: boolean } = {}): Promise<void> {
  const playable = tracks.filter((x) => x.link !== '');
  if (!playable.length) {
    toast(t('Share this song to Kanta once to play it from here'));
    return;
  }
  const start = Math.max(0, playable.indexOf(tracks[index]));
  Media.setShuffle(!!opts.shuffle);
  await Media.setQueue(playable.map(toQueueItem), opts.shuffle ? Math.floor(Math.random() * playable.length) : start);
  if (!Media.isNativeAvailable) toast(t('Playback works in the Android app'));
}

export async function playNext(track: Track): Promise<void> {
  if (!track.link) return toast(t('Share this song to Kanta once to play it from here'));
  await Media.insertNext(toQueueItem(track));
  toast(t('Playing next: {title}', { title: track.title }));
}

export function openInApp(track: Track): void {
  if (!track.link) return toast(t('Share this song to Kanta once to play it from here'));
  Media.openInApp(track.source, track.link);
  if (!Media.isNativeAvailable) toast(t('Opens in {app} on Android', { app: sourceName(track.source) }));
}

export function greetingKey(hour: number): string {
  if (hour < 5) return 'Good evening!';
  if (hour < 12) return 'Good morning!';
  if (hour < 18) return 'Good afternoon!';
  return 'Good evening!';
}
