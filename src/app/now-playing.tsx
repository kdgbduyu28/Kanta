import { router } from 'expo-router';
import {
  ChevronDown,
  Heart,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  SquareArrowOutUpRight,
} from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Media from '../../modules/kanta-media';
import { Artwork } from '../components/Artwork';
import { EmptyState } from '../components/EmptyState';
import { Slider } from '../components/Slider';
import { SourceBadge } from '../components/SourceBadge';
import { t } from '../i18n';
import { normalizeArtist, normalizeTitle } from '../lib/normalize';
import { positionNow } from '../lib/position';
import { useNow } from '../lib/useNow';
import { sourceName } from '../lib/sources';
import { formatClock } from '../lib/stats';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { toast } from '../store/toast';
import { colors, fonts, icon, radius, type } from '../theme';

const ART = Math.min(Dimensions.get('window').width - 64, 340);

export default function NowPlaying() {
  const insets = useSafeAreaInsets();
  const np = usePlayer((s) => s.nowPlaying);
  const queue = usePlayer((s) => s.queue);
  const { tracks, likeNowPlaying, setLiked } = useLibrary();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);
  const now = useNow(np?.state === 'playing', 250);

  const saved = useMemo(() => {
    if (!np) return null;
    const nt = normalizeTitle(np.title);
    const na = normalizeArtist(np.artist);
    return tracks.find((x) => x.source === np.source && normalizeTitle(x.title) === nt && normalizeArtist(x.artist) === na) ?? null;
  }, [np, tracks]);

  const playing = np?.state === 'playing' || np?.state === 'buffering';

  // Artwork shrinks a little on pause; a purple glow breathes behind it while playing.
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.35);
  useEffect(() => {
    scale.value = reduceMotion ? 1 : withSpring(playing ? 1 : 0.92, { damping: 14, stiffness: 120 });
    glow.value = playing && !reduceMotion
      ? withRepeat(withTiming(0.75, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true)
      : withTiming(0.3, { duration: 400 });
  }, [playing, reduceMotion, scale, glow]);
  const artStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.9 + glow.value * 0.2 }] }));

  if (!np) {
    return (
      <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
        <Header />
        <EmptyState
          icon={Music}
          title={t('Nothing is playing')}
          body={t('Play something in Spotify, YouTube Music or Apple Music, or pick a song in Kanta.')}
        />
      </View>
    );
  }

  const pos = positionNow(np, now);
  const upNext = queue.items.slice(queue.index + 1, queue.index + 21);

  const toggleLike = async () => {
    if (saved?.liked) return setLiked(saved.id, false);
    const tr = await likeNowPlaying(np);
    if (tr && tr.link === '') toast(t('Saved. Share this song to Kanta once to play it from here.'));
    else if (tr) toast(t('Added to Liked Songs'));
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }}>
      <Header onOpen={np.source !== 'local' && saved?.link ? () => Media.openInApp(np.source, saved.link) : undefined} />

      <View style={styles.artWrap}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={artStyle}>
          <Artwork uri={np.artworkUri} size={ART} radius={radius.lg} />
        </Animated.View>
      </View>

      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, { fontSize: 22 }]} numberOfLines={2}>
            {np.title}
          </Text>
          <View style={styles.sub}>
            <SourceBadge source={np.source} />
            <Text style={[type.caption, { fontSize: 13 }]} numberOfLines={1}>
              {np.artist}
            </Text>
          </View>
          {np.format ? <Text style={[type.caption, { color: colors.primary, marginTop: 4 }]}>{np.format}</Text> : null}
        </View>
        <Pressable onPress={toggleLike} hitSlop={12} accessibilityLabel={saved?.liked ? t('Remove from Liked Songs') : t('Add to Liked Songs')}>
          <Heart size={26} color={saved?.liked ? colors.primary : colors.text} fill={saved?.liked ? colors.primary : 'transparent'} strokeWidth={icon.stroke} />
        </Pressable>
      </View>

      <View style={{ marginTop: 20 }}>
        <Slider value={pos} min={0} max={Math.max(1, np.durationMs)} onCommit={(v) => Media.seekTo(v)} label={t('Position')} />
        <View style={styles.times}>
          <Text style={type.caption}>{formatClock(pos)}</Text>
          <Text style={type.caption}>{np.durationMs ? formatClock(np.durationMs) : '--:--'}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Ctrl label={t('Shuffle')} onPress={() => Media.setShuffle(!queue.shuffle)}>
          <Shuffle size={22} color={queue.shuffle ? colors.primary : colors.text} strokeWidth={icon.stroke} />
        </Ctrl>
        <Ctrl label={t('Previous')} onPress={() => Media.previous()}>
          <SkipBack size={28} color={colors.text} fill={colors.text} strokeWidth={icon.stroke} />
        </Ctrl>
        <Pressable style={styles.playBtn} onPress={() => (playing ? Media.pause() : Media.play())} accessibilityLabel={playing ? t('Pause') : t('Play')}>
          {playing ? <Pause size={30} color={colors.background} fill={colors.background} /> : <Play size={30} color={colors.background} fill={colors.background} />}
        </Pressable>
        <Ctrl label={t('Next')} onPress={() => Media.next()}>
          <SkipForward size={28} color={colors.text} fill={colors.text} strokeWidth={icon.stroke} />
        </Ctrl>
        <Ctrl
          label={t('Repeat')}
          onPress={() => Media.setRepeat(queue.repeat === 'off' ? 'all' : queue.repeat === 'all' ? 'one' : 'off')}
        >
          {queue.repeat === 'one' ? (
            <Repeat1 size={22} color={colors.primary} strokeWidth={icon.stroke} />
          ) : (
            <Repeat size={22} color={queue.repeat === 'all' ? colors.primary : colors.text} strokeWidth={icon.stroke} />
          )}
        </Ctrl>
      </View>

      <Pressable style={styles.lyricsBtn} onPress={() => router.push('/lyrics')}>
        <Text style={styles.lyricsText}>♫ {t('Lyrics')}</Text>
      </Pressable>

      {upNext.length ? (
        <View style={{ marginTop: 28 }}>
          <Text style={[type.title, { marginBottom: 8 }]}>{t('Up next')}</Text>
          {upNext.map((q, i) => (
            <Pressable key={`${q.trackId}${i}`} style={styles.upRow} onPress={() => void Media.jumpTo(queue.index + 1 + i)}>
              <SourceBadge source={q.source} />
              <View style={{ flex: 1 }}>
                <Text style={type.bodyStrong} numberOfLines={1}>
                  {q.title}
                </Text>
                <Text style={type.caption} numberOfLines={1}>
                  {q.artist} · {q.source === 'local' ? t('On this phone') : sourceName(q.source)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Header({ onOpen }: { onOpen?: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={t('Close')}>
        <ChevronDown size={26} color={colors.text} strokeWidth={icon.stroke} />
      </Pressable>
      <Text style={styles.headerTitle}>{t('NOW PLAYING')}</Text>
      <Pressable onPress={onOpen} disabled={!onOpen} hitSlop={12} accessibilityLabel={t('Open in app')}>
        <SquareArrowOutUpRight size={20} color={onOpen ? colors.text : 'transparent'} strokeWidth={icon.stroke} />
      </Pressable>
    </View>
  );
}

function Ctrl({ children, onPress, label }: { children: ReactNode; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.2, color: colors.textMuted },
  artWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  glow: {
    position: 'absolute',
    width: ART * 0.9,
    height: ART * 0.9,
    borderRadius: ART,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 40,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 28, gap: 12 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  playBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  lyricsBtn: { alignSelf: 'center', marginTop: 24, backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  lyricsText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  upRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
});
