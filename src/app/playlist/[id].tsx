import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart, Pencil, Play, Shuffle, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Artwork } from '../../components/Artwork';
import { EmptyState } from '../../components/EmptyState';
import { GradientButton } from '../../components/GradientButton';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { openTrackMenu } from '../../components/TrackMenu';
import { TrackRow } from '../../components/TrackRow';
import type { Playlist } from '../../db/playlists';
import type { Track } from '../../db/tracks';
import { t } from '../../i18n';
import { playTracks } from '../../lib/playback';
import { formatLong } from '../../lib/stats';
import { useLibrary } from '../../store/library';
import { usePlayer } from '../../store/player';
import { colors, fonts, gradient, icon, radius, type } from '../../theme';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isLiked = id === 'liked';
  const lib = useLibrary();
  const nowTitle = usePlayer((s) => s.nowPlaying?.title);
  const [loaded, setLoaded] = useState<{ playlist: Playlist; tracks: Track[] } | null>(null);
  const [editing, setEditing] = useState(false);
  const { tracks: allTracks, getPlaylist, version } = lib;

  // Liked Songs comes straight from the library; other playlists load from the database.
  const liked = useMemo(
    () => ({
      playlist: { id: 'liked', name: t('Liked Songs'), description: null, createdAt: 0 },
      tracks: allTracks.filter((x) => x.liked),
    }),
    [allTracks],
  );
  useEffect(() => {
    if (isLiked) return;
    let live = true;
    void getPlaylist(id).then((d) => {
      if (live) setLoaded(d);
    });
    return () => {
      live = false;
    };
  }, [id, isLiked, getPlaylist, version]);
  const data = isLiked ? liked : loaded;

  if (!data) return <Screen><ScreenHeader title="" back /></Screen>;
  const { playlist, tracks } = data;
  const total = tracks.reduce((a, x) => a + x.durationMs, 0);
  const covers = tracks.map((x) => x.artworkUrl).filter((x): x is string => !!x);

  const remove = () =>
    Alert.alert(t('Delete playlist?'), t('"{name}" will be removed. Songs stay in your library.', { name: playlist.name }), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          await lib.deletePlaylist(playlist.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <ScreenHeader
        title=""
        back
        right={
          isLiked ? null : (
            <View style={{ flexDirection: 'row', gap: 18 }}>
              <Pressable onPress={() => setEditing(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('Edit')}>
                <Pencil size={icon.size} color={colors.text} strokeWidth={icon.stroke} />
              </Pressable>
              <Pressable onPress={remove} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('Delete')}>
                <Trash2 size={icon.size} color={colors.text} strokeWidth={icon.stroke} />
              </Pressable>
            </View>
          )
        }
      />
      <Text style={type.display}>{playlist.name}</Text>
      <Text style={[type.caption, { fontSize: 12, marginTop: 4 }]}>
        {t('Playlist • {n} songs • {time}', { n: tracks.length, time: formatLong(total) })}
      </Text>

      <View style={styles.cover}>
        {isLiked ? (
          <LinearGradient colors={gradient.primary} style={styles.coverBox}>
            <Heart size={64} color={colors.text} fill={colors.text} />
          </LinearGradient>
        ) : (
          <Artwork size={220} radius={radius.md} mosaic={covers} />
        )}
      </View>
      {playlist.description ? <Text style={[type.caption, styles.desc]}>{playlist.description}</Text> : null}

      <View style={styles.buttons}>
        <GradientButton label={t('Play')} icon={Play} onPress={() => void playTracks(tracks, 0)} style={{ flex: 1 }} disabled={!tracks.length} />
        <GradientButton
          label={t('Shuffle')}
          icon={Shuffle}
          variant="secondary"
          onPress={() => void playTracks(tracks, 0, { shuffle: true })}
          style={{ flex: 1 }}
          disabled={!tracks.length}
        />
      </View>

      {!tracks.length ? (
        <EmptyState
          title={isLiked ? t('No liked songs yet') : t('This playlist is empty')}
          body={isLiked ? t('Tap the heart on Now Playing to save a song here.') : t('Add songs with the ⋯ button on any song.')}
        />
      ) : (
        tracks.map((s, i) => (
          <TrackRow
            key={`${s.id}${i}`}
            title={s.title}
            artist={s.artist}
            source={s.source}
            showArtwork={false}
            playing={s.title === nowTitle}
            onPress={() => void playTracks(tracks, i)}
            onMore={() => openTrackMenu(s, isLiked ? undefined : { playlistId: playlist.id, position: i })}
          />
        ))
      )}

      {editing ? <EditPlaylist playlist={playlist} onClose={() => setEditing(false)} /> : null}
    </Screen>
  );
}

function EditPlaylist({ playlist, onClose }: { playlist: Playlist; onClose: () => void }) {
  const [name, setName] = useState(playlist.name);
  const [desc, setDesc] = useState(playlist.description ?? '');
  const rename = useLibrary((s) => s.renamePlaylist);
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.dialog}>
        <Text style={type.title}>{t('Edit playlist')}</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder={t('Playlist name')} placeholderTextColor={colors.textMuted} />
        <TextInput value={desc} onChangeText={setDesc} style={styles.input} placeholder={t('Description')} placeholderTextColor={colors.textMuted} />
        <GradientButton
          label={t('Save')}
          disabled={!name.trim()}
          onPress={async () => {
            await rename(playlist.id, name, desc);
            onClose();
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cover: { alignItems: 'center', marginVertical: 20 },
  coverBox: { width: 220, height: 220, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  desc: { textAlign: 'center', fontSize: 12, marginBottom: 12 },
  buttons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  dialog: { position: 'absolute', left: 24, right: 24, top: '25%', backgroundColor: colors.surface, borderRadius: radius.md, padding: 20, gap: 14 },
  input: { height: 48, borderRadius: radius.sm, backgroundColor: colors.surfaceSunken, color: colors.text, paddingHorizontal: 12, fontFamily: fonts.regular },
});

