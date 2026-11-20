import { Heart, ListEnd, ListPlus, ListX, Plus, SquareArrowOutUpRight, Trash2 } from 'lucide-react-native';
import { useState, type ComponentType } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import type { Track } from '../db/tracks';
import { t } from '../i18n';
import { openInApp, playNext } from '../lib/playback';
import { sourceName } from '../lib/sources';
import { useLibrary } from '../store/library';
import { toast } from '../store/toast';
import { colors, fonts, icon, radius, type } from '../theme';
import { Artwork } from './Artwork';
import { GradientButton } from './GradientButton';

type Ctx = { track: Track; playlistId?: string; position?: number } | null;

const useMenu = create<{ ctx: Ctx; mode: 'menu' | 'pick' }>(() => ({ ctx: null, mode: 'menu' }));

export const openTrackMenu = (track: Track, inPlaylist?: { playlistId: string; position: number }) =>
  useMenu.setState({ ctx: { track, ...inPlaylist }, mode: 'menu' });

const close = () => useMenu.setState({ ctx: null });

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/** Bottom sheet behind every song's ⋯ button. Rendered once, in the root layout. */
export function TrackMenuHost() {
  const { ctx, mode } = useMenu();
  const insets = useSafeAreaInsets();
  const lib = useLibrary();
  const [newName, setNewName] = useState('');
  if (!ctx) return null;
  const { track } = ctx;
  const liked = lib.tracks.find((x) => x.id === track.id)?.liked ?? track.liked;

  const item = (Icon: IconType, label: string, onPress: () => void, danger?: boolean) => (
    <Pressable key={label} style={styles.item} onPress={onPress} accessibilityRole="button">
      <Icon size={icon.size} color={danger ? colors.danger : colors.text} strokeWidth={icon.stroke} />
      <Text style={[type.body, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );

  const addTo = async (playlistId: string, name: string) => {
    await lib.addToPlaylist(playlistId, track.id);
    toast(t('Added to {name}', { name }));
    close();
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={close} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grab} />
        <View style={styles.head}>
          <Artwork uri={track.artworkUrl} size={48} radius={8} />
          <View style={{ flex: 1 }}>
            <Text style={type.bodyStrong} numberOfLines={1}>
              {track.title}
            </Text>
            <Text style={type.caption} numberOfLines={1}>
              {[track.artist, track.source === 'local' ? t('On this phone') : sourceName(track.source)].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        {mode === 'menu' ? (
          <View>
            {item(ListEnd, t('Play next'), () => {
              void playNext(track);
              close();
            })}
            {item(ListPlus, t('Add to playlist'), () => useMenu.setState({ mode: 'pick' }))}
            {ctx.playlistId != null && ctx.position != null
              ? item(ListX, t('Remove from this playlist'), () => {
                  void lib.removeFromPlaylist(ctx.playlistId!, ctx.position!);
                  close();
                })
              : null}
            {item(Heart, liked ? t('Remove from Liked Songs') : t('Add to Liked Songs'), () => {
              void lib.setLiked(track.id, !liked);
              close();
            })}
            {track.source !== 'local'
              ? item(SquareArrowOutUpRight, t('Open in {app}', { app: sourceName(track.source) }), () => {
                  openInApp(track);
                  close();
                })
              : null}
            {track.source !== 'local'
              ? item(
                  Trash2,
                  t('Remove from Kanta'),
                  () => {
                    void lib.deleteTrack(track.id);
                    close();
                  },
                  true,
                )
              : null}
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 380 }}>
            <View style={styles.newRow}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder={t('New playlist name')}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              <GradientButton
                label={t('Create')}
                icon={Plus}
                disabled={!newName.trim()}
                onPress={async () => {
                  const p = await lib.createPlaylist(newName.trim());
                  setNewName('');
                  await addTo(p.id, p.name);
                }}
              />
            </View>
            {lib.playlists.map((p) => (
              <Pressable key={p.id} style={styles.item} onPress={() => void addTo(p.id, p.name)}>
                <Artwork size={36} radius={6} mosaic={p.covers} />
                <Text style={type.body}>{p.name}</Text>
                <Text style={[type.caption, { marginLeft: 'auto' }]}>{t('{n} songs', { n: p.count })}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceRaised, marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottomColor: 'rgba(255,255,255,0.06)', borderBottomWidth: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  input: {
    flex: 1,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    color: colors.text,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
  },
});
