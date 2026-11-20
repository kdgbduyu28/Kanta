import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Heart, Plus, Search, X } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { Source } from '../../../modules/kanta-media';
import { Artwork } from '../../components/Artwork';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { GradientButton } from '../../components/GradientButton';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { openTrackMenu } from '../../components/TrackMenu';
import { TrackRow } from '../../components/TrackRow';
import type { Track } from '../../db/tracks';
import { t } from '../../i18n';
import { playTracks } from '../../lib/playback';
import { libraryEmptyState, type LibraryTab } from '../../lib/sections';
import { sourceName } from '../../lib/sources';
import { compactCount } from '../../lib/stats';
import { useLibrary } from '../../store/library';
import { colors, fonts, gradient, icon, radius, type } from '../../theme';

const TABS: { id: LibraryTab; label: string }[] = [
  { id: 'playlists', label: 'Playlists' },
  { id: 'songs', label: 'Songs' },
  { id: 'artists', label: 'Artists' },
  { id: 'albums', label: 'Albums' },
];

export default function LibraryScreen() {
  const params = useLocalSearchParams<{ source?: Source; artist?: string; album?: string }>();
  const [tab, setTab] = useState<LibraryTab>('playlists');
  const [creating, setCreating] = useState(false);
  const { tracks, playlists } = useLibrary();
  const filtered = params.source || params.artist != null || params.album != null;

  const songs = useMemo(
    () =>
      tracks.filter(
        (x) =>
          (!params.source || x.source === params.source) &&
          (params.artist == null || x.artist === params.artist) &&
          (params.album == null || x.album === params.album),
      ),
    [tracks, params.source, params.artist, params.album],
  );
  const artists = useMemo(() => group(tracks, (x) => x.artist), [tracks]);
  const albums = useMemo(() => group(tracks.filter((x) => x.album), (x) => x.album!), [tracks]);
  const liked = tracks.filter((x) => x.liked);

  if (filtered) {
    const title = params.source
      ? params.source === 'local'
        ? t('On this phone')
        : sourceName(params.source)
      : (params.artist ?? params.album ?? '');
    return (
      <Screen tab>
        <ScreenHeader
          title={title}
          subtitle={t('{n} songs', { n: songs.length })}
          right={
            <Pressable onPress={() => router.setParams({ source: undefined, artist: undefined, album: undefined })} hitSlop={10}>
              <X size={22} color={colors.text} strokeWidth={icon.stroke} />
            </Pressable>
          }
        />
        <SongList songs={songs} />
      </Screen>
    );
  }

  const empty = libraryEmptyState(tab, {
    playlists: playlists.length + liked.length,
    songs: tracks.length,
    artists: artists.length,
    albums: albums.length,
  });

  return (
    <Screen tab>
      <ScreenHeader
        title={t('Your Library')}
        subtitle={t('Your saved music in one place')}
        right={
          <Pressable onPress={() => router.push('/search')} hitSlop={10} accessibilityLabel={t('Search')}>
            <Search size={icon.size} color={colors.text} strokeWidth={icon.stroke} />
          </Pressable>
        }
      />
      <View style={styles.chips}>
        {TABS.map((x) => (
          <Chip key={x.id} label={t(x.label)} active={tab === x.id} onPress={() => setTab(x.id)} />
        ))}
      </View>

      {tab === 'playlists' ? (
        <View style={{ gap: 4 }}>
          <Pressable style={styles.newRow} onPress={() => setCreating(true)}>
            <View style={styles.newIcon}>
              <Plus size={22} color={colors.primary} strokeWidth={icon.stroke} />
            </View>
            <Text style={type.bodyStrong}>{t('New playlist')}</Text>
          </Pressable>
          <Row
            index={0}
            title={t('Liked Songs')}
            subtitle={t('{n} songs', { n: compactCount(liked.length) })}
            art={<Artwork size={56} radius={radius.sm} fallbackIcon={Heart} colors={gradient.primary} />}
            onPress={() => router.push('/playlist/liked')}
          />
          {playlists.map((p, i) => (
            <Row
              key={p.id}
              index={i + 1}
              title={p.name}
              subtitle={t('{n} songs', { n: p.count })}
              art={<Artwork size={56} radius={radius.sm} mosaic={p.covers} />}
              onPress={() => router.push(`/playlist/${p.id}`)}
            />
          ))}
          {!playlists.length ? (
            <Text style={[type.caption, { textAlign: 'center', marginTop: 16 }]}>{t('Make one and mix songs from any app.')}</Text>
          ) : null}
        </View>
      ) : empty ? (
        <EmptyState
          title={empty.title}
          body={empty.body}
          action={empty.action === 'sources' ? { label: t('Sources'), onPress: () => router.push('/sources') } : undefined}
        />
      ) : tab === 'songs' ? (
        <SongList songs={tracks} />
      ) : (
        (tab === 'artists' ? artists : albums).map((g, i) => (
          <Row
            key={g.key}
            index={i}
            title={g.key}
            subtitle={t('{n} songs', { n: g.items.length })}
            art={<Artwork uri={g.items.find((x) => x.artworkUrl)?.artworkUrl} size={56} radius={tab === 'artists' ? 28 : radius.sm} />}
            onPress={() => router.setParams(tab === 'artists' ? { artist: g.key } : { album: g.key })}
          />
        ))
      )}

      <NewPlaylistModal visible={creating} onClose={() => setCreating(false)} />
    </Screen>
  );
}

function SongList({ songs }: { songs: Track[] }) {
  return (
    <View>
      {songs.map((s, i) => (
        <TrackRow
          key={s.id}
          title={s.title}
          artist={s.artist}
          source={s.source}
          artworkUri={s.artworkUrl}
          onPress={() => void playTracks(songs, i)}
          onMore={() => openTrackMenu(s)}
        />
      ))}
    </View>
  );
}

function Row(p: { title: string; subtitle: string; art: ReactNode; onPress: () => void; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(p.index, 12) * 30).duration(250)}>
      <Pressable style={styles.row} onPress={p.onPress}>
        {p.art}
        <View style={{ flex: 1 }}>
          <Text style={type.bodyStrong} numberOfLines={1}>
            {p.title}
          </Text>
          <Text style={type.caption}>{p.subtitle}</Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} strokeWidth={icon.stroke} />
      </Pressable>
    </Animated.View>
  );
}

function group(tracks: Track[], key: (t: Track) => string) {
  const m = new Map<string, Track[]>();
  for (const x of tracks) {
    const k = key(x);
    if (!k) continue;
    m.set(k, [...(m.get(k) ?? []), x]);
  }
  return [...m.entries()]
    .map(([k, items]) => ({ key: k, items }))
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { sensitivity: 'base' }));
}

export function NewPlaylistModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const create = useLibrary((s) => s.createPlaylist);
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.dialog}>
        <Text style={type.title}>{t('New playlist')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          placeholder={t('Playlist name')}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <GradientButton
          label={t('Create')}
          disabled={!name.trim()}
          onPress={async () => {
            const p = await create(name.trim());
            setName('');
            onClose();
            router.push(`/playlist/${p.id}`);
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  newIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  dialog: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '30%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 20,
    gap: 14,
  },
  input: {
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    color: colors.text,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
  },
});
