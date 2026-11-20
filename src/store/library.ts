import { Platform } from 'react-native';
import { create } from 'zustand';
import * as Media from '../../modules/kanta-media';
import type { AudioSettings, NowPlaying, QueueItem, Source } from '../../modules/kanta-media';
import type { Db } from '../db/db';
import * as H from '../db/history';
import * as P from '../db/playlists';
import { getSetting, setSetting } from '../db/settings';
import * as T from '../db/tracks';
import { setLang, type Lang } from '../i18n';
import type { CustomPreset } from '../lib/eqPresets';
import { getLyrics, type Lyrics } from '../lib/lrclib';
import { refreshMissingDetails, saveFromText, saveNowPlaying, syncLocalLibrary } from '../lib/save';
import { searchLibrary, type SearchFilter, type SearchResult } from '../lib/search';
import { samplePlaylists, samplePlaylistTracks, samplePlays, sampleTracks } from '../sample/sampleData';

export type Prefs = {
  setupDone: boolean;
  name: string;
  lang: Lang;
  historyEnabled: boolean;
  autoAdvance: boolean;
  upNextNotifications: boolean;
  audio: AudioSettings;
  eqCustomPresets: CustomPreset[];
  spotifyClientId: string | null;
};

export const DEFAULT_AUDIO: AudioSettings = {
  quality: 'auto',
  eqEnabled: false,
  eqGainsDb: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  crossfadeSec: 0,
  gapless: true,
  normalize: false,
  balance: 0,
};

export const DEFAULT_PREFS: Prefs = {
  setupDone: false,
  name: '',
  lang: 'en',
  historyEnabled: true,
  autoAdvance: true,
  upNextNotifications: true,
  audio: DEFAULT_AUDIO,
  eqCustomPresets: [],
  spotifyClientId: null,
};

type MostPlayed = H.Play & { count: number };

type LibraryState = {
  ready: boolean;
  prefs: Prefs;
  tracks: T.Track[];
  playlists: P.PlaylistSummary[];
  recent: H.Play[];
  mostPlayed: MostPlayed[];
  listeningMs: number;
  sources: Source[];
  /** Bumps on every change so screens holding their own queries can reload. */
  version: number;

  init: () => Promise<void>;
  reload: () => Promise<void>;
  setPref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => Promise<void>;

  saveText: (text: string) => Promise<T.Track | null>;
  likeNowPlaying: (np: NowPlaying) => Promise<T.Track | null>;
  setLiked: (id: string, liked: boolean) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;

  createPlaylist: (name: string, description?: string) => Promise<P.Playlist>;
  renamePlaylist: (id: string, name: string, description?: string | null) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, position: number) => Promise<void>;
  movePlaylistTrack: (playlistId: string, from: number, to: number) => Promise<void>;
  getPlaylist: (id: string) => Promise<{ playlist: P.Playlist; tracks: T.Track[] } | null>;

  search: (q: string, filter: SearchFilter) => Promise<SearchResult[]>;
  lyrics: (q: { title: string; artist: string; durationMs: number }) => Promise<Lyrics | null>;
  clearHistory: () => Promise<void>;
  syncLocal: () => Promise<void>;
};

let db: Db | null = null;
const isWeb = Platform.OS === 'web';
const DAY = 24 * 3600 * 1000;

export const toQueueItem = (t: T.Track): QueueItem => ({
  trackId: t.id,
  source: t.source,
  link: t.link,
  title: t.title,
  artist: t.artist,
  durationMs: t.durationMs,
});

/** Pushes the prefs the native side needs. */
function applyNative(p: Prefs) {
  Media.setAudioSettings(p.audio);
  Media.setAutoAdvance(p.autoAdvance);
  Media.setUpNextNotifications(p.upNextNotifications);
  Media.setHistoryEnabled(p.historyEnabled);
}

export const useLibrary = create<LibraryState>((set, get) => {
  const bump = () => set({ version: get().version + 1 });
  const change = async (fn: (d: Db) => Promise<unknown>) => {
    if (!db) return;
    await fn(db);
    await get().reload();
  };

  return {
    ready: false,
    prefs: DEFAULT_PREFS,
    tracks: [],
    playlists: [],
    recent: [],
    mostPlayed: [],
    listeningMs: 0,
    sources: [],
    version: 0,

    init: async () => {
      if (isWeb) {
        set({
          ready: true,
          prefs: { ...DEFAULT_PREFS, setupDone: true, name: 'Jonathan' },
          tracks: sampleTracks,
          playlists: samplePlaylists,
          recent: samplePlays,
          mostPlayed: samplePlays.map((p, i) => ({ ...p, count: 6 - i })),
          listeningMs: 12 * 3600 * 1000,
          sources: ['spotify', 'ytmusic', 'applemusic', 'local'],
        });
        return;
      }
      const { openExpoDb } = await import('../db/expoDb');
      db = await openExpoDb();
      const prefs: Prefs = { ...DEFAULT_PREFS };
      for (const k of Object.keys(DEFAULT_PREFS) as (keyof Prefs)[]) {
        (prefs as Record<string, unknown>)[k] = await getSetting(db, k, DEFAULT_PREFS[k]);
      }
      prefs.audio = { ...DEFAULT_AUDIO, ...prefs.audio };
      setLang(prefs.lang);
      applyNative(prefs);
      set({ prefs });
      await get().reload();
      set({ ready: true });
      // Background work: fill details of songs saved offline, and sync local files.
      void refreshMissingDetails(db).then((n) => (n ? get().reload() : undefined));
      void get().syncLocal();
      // Reconnect the optional Spotify kit used last time.
      if (prefs.spotifyClientId && !Media.spotifyIsConnected()) void Media.spotifyConnect(prefs.spotifyClientId);
    },

    reload: async () => {
      if (!db) return bump();
      const [tracks, playlists, recent, mostPlayed, listeningMs, sources] = await Promise.all([
        T.listTracks(db),
        P.listPlaylists(db),
        H.recentPlays(db, 12),
        H.mostPlayed(db, { sinceMs: Date.now() - 30 * DAY, limit: 10 }),
        H.listeningMs(db),
        T.sourcesWithSongs(db),
      ]);
      set({ tracks, playlists, recent, mostPlayed, listeningMs, sources, version: get().version + 1 });
    },

    setPref: async (key, value) => {
      const prefs = { ...get().prefs, [key]: value };
      set({ prefs });
      if (key === 'lang') setLang(value as Lang);
      applyNative(prefs);
      if (db) await setSetting(db, key, value);
    },

    saveText: async (text) => {
      if (!db) return null;
      const t = await saveFromText(db, text);
      if (t) await get().reload();
      return t;
    },

    likeNowPlaying: async (np) => {
      if (!db) return null;
      const t = await saveNowPlaying(db, np);
      await get().reload();
      return t;
    },

    setLiked: async (id, liked) => {
      if (isWeb) return set({ tracks: get().tracks.map((t) => (t.id === id ? { ...t, liked } : t)) });
      await change((d) => T.setLiked(d, id, liked));
    },

    deleteTrack: (id) => change((d) => T.deleteTrack(d, id)),

    createPlaylist: async (name, description) => {
      if (!db) {
        const p = { id: `web${Date.now()}`, name, description: description ?? null, createdAt: Date.now() };
        set({ playlists: [{ ...p, count: 0, durationMs: 0, covers: [] }, ...get().playlists] });
        return p;
      }
      const p = await P.createPlaylist(db, name, description);
      await get().reload();
      return p;
    },
    renamePlaylist: (id, name, description) => change((d) => P.renamePlaylist(d, id, name, description)),
    deletePlaylist: (id) => change((d) => P.deletePlaylist(d, id)),
    addToPlaylist: (pid, tid) => change((d) => P.addToPlaylist(d, pid, tid)),
    removeFromPlaylist: (pid, pos) => change((d) => P.removeFromPlaylist(d, pid, pos)),
    movePlaylistTrack: (pid, from, to) => change((d) => P.movePlaylistTrack(d, pid, from, to)),

    getPlaylist: async (id) => {
      if (!db) {
        const s = get().playlists.find((p) => p.id === id);
        if (!s) return null;
        const ids = samplePlaylistTracks[id] ?? [];
        return { playlist: s, tracks: ids.map((i) => get().tracks.find((t) => t.id === i)!).filter(Boolean) };
      }
      const playlist = await P.getPlaylist(db, id);
      return playlist ? { playlist, tracks: await P.getPlaylistTracks(db, id) } : null;
    },

    search: async (q, filter) => {
      if (!db) {
        const n = q.toLowerCase().trim();
        if (!n) return [];
        return get()
          .tracks.filter((t) => `${t.title} ${t.artist}`.toLowerCase().includes(n))
          .map((track) => ({ kind: 'song' as const, track }));
      }
      return searchLibrary(db, q, filter);
    },

    lyrics: async (q) => (db ? getLyrics(db, q) : null),

    clearHistory: () => change((d) => H.clearHistory(d)),

    syncLocal: async () => {
      if (!db || !Media.hasAudioPermission()) return;
      const files = await Media.scanLocalLibrary();
      const r = await syncLocalLibrary(db, files);
      if (r.added || r.removed) await get().reload();
    },
  };
});
