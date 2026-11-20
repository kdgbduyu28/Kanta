import { AppState, Platform } from 'react-native';
import { create } from 'zustand';
import * as Media from '../../modules/kanta-media';
import type { NowPlaying, QueueState, Source } from '../../modules/kanta-media';
import { sampleNowPlaying } from '../sample/sampleData';

type PlayerState = {
  nowPlaying: NowPlaying | null;
  queue: QueueState;
  access: boolean;
  overlay: boolean;
  audioPermission: boolean;
  installed: Source[];
  spotifyConnected: boolean;
  /** Re-reads permissions and installed apps (after returning from Android settings). */
  refreshStatus: () => void;
  start: () => () => void;
};

export const usePlayer = create<PlayerState>((set) => ({
  nowPlaying: null,
  queue: Media.getQueueState(),
  access: false,
  overlay: false,
  audioPermission: false,
  installed: [],
  spotifyConnected: false,

  refreshStatus: () =>
    set({
      access: Media.hasNotificationAccess(),
      overlay: Media.canDrawOverlays(),
      audioPermission: Media.hasAudioPermission(),
      installed: Media.getInstalledSources(),
      spotifyConnected: Media.spotifyIsConnected(),
    }),

  start: () => {
    const st = usePlayer.getState();
    st.refreshStatus();
    if (!Media.isNativeAvailable && Platform.OS === 'web') {
      set({ nowPlaying: sampleNowPlaying, access: true, installed: ['spotify', 'ytmusic', 'applemusic'] });
      return () => {};
    }
    set({ nowPlaying: Media.getNowPlaying(), queue: Media.getQueueState() });
    const subs = [
      Media.addListener('nowPlaying', (np) => set({ nowPlaying: np })),
      Media.addListener('queueState', (q) => set({ queue: q })),
      Media.addListener('accessChanged', () => usePlayer.getState().refreshStatus()),
    ];
    const app = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        usePlayer.getState().refreshStatus();
        set({ nowPlaying: Media.getNowPlaying(), queue: Media.getQueueState() });
      }
    });
    return () => {
      subs.forEach((s) => s.remove());
      app.remove();
    };
  },
}));
