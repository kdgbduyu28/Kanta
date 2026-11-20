// JS face of the kanta-media native module. On Android it calls the Kotlin module;
// anywhere else (web preview, tests) it is a harmless stub.
import { Platform } from 'react-native';
import { requireOptionalNativeModule, type EventSubscription } from 'expo-modules-core';
import type {
  AudioSettings,
  KantaEvent,
  LocalTrack,
  NowPlaying,
  QueueItem,
  QueueState,
  RepeatMode,
  Source,
} from './src/types';

export * from './src/types';

type Native = {
  hasNotificationAccess(): boolean;
  openNotificationAccessSettings(): void;
  canDrawOverlays(): boolean;
  openOverlaySettings(): void;
  hasAudioPermission(): boolean;
  getInstalledSources(): Source[];
  getNowPlaying(): NowPlaying | null;
  play(): void;
  pause(): void;
  next(): void;
  previous(): void;
  seekTo(ms: number): void;
  openInApp(source: Source, link: string): void;
  setQueue(items: QueueItem[], startIndex: number): Promise<void>;
  insertNext(item: QueueItem): Promise<void>;
  jumpTo(index: number): Promise<void>;
  setShuffle(on: boolean): void;
  setRepeat(mode: RepeatMode): void;
  getQueueState(): QueueState;
  setAutoAdvance(on: boolean): void;
  setUpNextNotifications(on: boolean): void;
  setHistoryEnabled(on: boolean): void;
  spotifyConnect(clientId: string): Promise<boolean>;
  spotifyDisconnect(): void;
  spotifyIsConnected(): boolean;
  scanLocalLibrary(): Promise<LocalTrack[]>;
  setAudioSettings(s: AudioSettings): void;
  addListener(event: KantaEvent, cb: (payload: any) => void): EventSubscription;
};

const native: Native | null = Platform.OS === 'android' ? requireOptionalNativeModule<Native>('KantaMedia') : null;

const emptyQueue: QueueState = { index: -1, shuffle: false, repeat: 'off', items: [] };
const noop = () => {};

export const isNativeAvailable = native != null;

export const hasNotificationAccess = () => native?.hasNotificationAccess() ?? false;
export const openNotificationAccessSettings = () => native?.openNotificationAccessSettings();
export const canDrawOverlays = () => native?.canDrawOverlays() ?? false;
export const openOverlaySettings = () => native?.openOverlaySettings();
export const hasAudioPermission = () => native?.hasAudioPermission() ?? false;
export const getInstalledSources = (): Source[] => native?.getInstalledSources() ?? [];
export const getNowPlaying = (): NowPlaying | null => native?.getNowPlaying() ?? null;

export const play = () => native?.play();
export const pause = () => native?.pause();
export const next = () => native?.next();
export const previous = () => native?.previous();
export const seekTo = (ms: number) => native?.seekTo(Math.max(0, Math.round(ms)));
export const openInApp = (source: Source, link: string) => native?.openInApp(source, link);

export const setQueue = (items: QueueItem[], startIndex: number) =>
  native?.setQueue(items, startIndex) ?? Promise.resolve();
export const insertNext = (item: QueueItem) => native?.insertNext(item) ?? Promise.resolve();
export const jumpTo = (index: number) => native?.jumpTo(index) ?? Promise.resolve();
export const setShuffle = (on: boolean) => native?.setShuffle(on);
export const setRepeat = (mode: RepeatMode) => native?.setRepeat(mode);
export const getQueueState = (): QueueState => native?.getQueueState() ?? emptyQueue;
export const setAutoAdvance = (on: boolean) => native?.setAutoAdvance(on);
export const setUpNextNotifications = (on: boolean) => native?.setUpNextNotifications(on);
export const setHistoryEnabled = (on: boolean) => native?.setHistoryEnabled(on);

export const spotifyConnect = (clientId: string) => native?.spotifyConnect(clientId) ?? Promise.resolve(false);
export const spotifyDisconnect = () => native?.spotifyDisconnect();
export const spotifyIsConnected = () => native?.spotifyIsConnected() ?? false;

export const scanLocalLibrary = (): Promise<LocalTrack[]> => native?.scanLocalLibrary() ?? Promise.resolve([]);
export const setAudioSettings = (s: AudioSettings) => native?.setAudioSettings(s);

export function addListener(event: 'nowPlaying', cb: (np: NowPlaying | null) => void): { remove(): void };
export function addListener(event: 'queueState', cb: (q: QueueState) => void): { remove(): void };
export function addListener(event: 'historyChanged' | 'accessChanged', cb: () => void): { remove(): void };
export function addListener(event: KantaEvent, cb: (payload: any) => void): { remove(): void } {
  if (!native) return { remove: noop };
  // Native events wrap their payload as { value } so null can be sent.
  return native.addListener(event, (e: { value?: unknown }) => cb(e?.value ?? null));
}
