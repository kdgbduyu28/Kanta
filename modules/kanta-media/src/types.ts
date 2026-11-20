// Shared types of the kanta-media native module (plan: "Shared JS API").

export type Source = 'spotify' | 'ytmusic' | 'applemusic' | 'local';
export type StreamingSource = Exclude<Source, 'local'>;
export type PlayState = 'playing' | 'paused' | 'buffering' | 'stopped';

export type NowPlaying = {
  source: Source;
  title: string;
  artist: string;
  album: string | null;
  durationMs: number;
  positionMs: number;
  /** Epoch ms when positionMs was read. */
  positionAt: number;
  state: PlayState;
  artworkUri: string | null;
  mediaId: string | null;
  format: string | null;
};

export type QueueItem = {
  trackId: string;
  source: Source;
  link: string;
  title: string;
  artist: string;
  durationMs: number;
};

export type RepeatMode = 'off' | 'all' | 'one';

export type QueueState = { index: number; shuffle: boolean; repeat: RepeatMode; items: QueueItem[] };

export type QualityMode = 'auto' | 'high' | 'lossless' | 'hires';

export type AudioSettings = {
  quality: QualityMode;
  eqEnabled: boolean;
  /** 9 values, dB, -12..12, for 60/150/400/1k/2.4k/6k/10k/14k/16k Hz. */
  eqGainsDb: number[];
  crossfadeSec: number;
  gapless: boolean;
  normalize: boolean;
  /** -1 (left) .. 1 (right) */
  balance: number;
};

export type LocalTrack = {
  uri: string;
  mediaStoreId: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  artworkUri: string | null;
  format: string | null;
};

export type KantaEvent = 'nowPlaying' | 'queueState' | 'historyChanged' | 'accessChanged';
