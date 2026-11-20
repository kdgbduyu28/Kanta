import { router } from 'expo-router';
import { Pause, Play, SkipForward } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Media from '../../modules/kanta-media';
import { positionNow } from '../lib/position';
import { useNow } from '../lib/useNow';
import { usePlayer } from '../store/player';
import { colors, icon, radius, type } from '../theme';
import { Artwork } from './Artwork';
import { SourceBadge } from './SourceBadge';

/** Above the tab bar whenever something is playing in any of the apps. */
export function MiniPlayer() {
  const np = usePlayer((s) => s.nowPlaying);
  const now = useNow(np?.state === 'playing', 1000);
  if (!np) return null;
  const playing = np.state === 'playing' || np.state === 'buffering';
  const frac = np.durationMs > 0 ? positionNow(np, now) / np.durationMs : 0;
  return (
    <Animated.View entering={FadeInDown.duration(220)} style={styles.wrap}>
      <Pressable style={styles.card} onPress={() => router.push('/now-playing')} accessibilityRole="button" accessibilityLabel={`${np.title}, ${np.artist}`}>
        <Artwork uri={np.artworkUri} size={40} radius={8} />
        <View style={styles.text}>
          <Text style={type.bodyStrong} numberOfLines={1}>
            {np.title}
          </Text>
          <View style={styles.sub}>
            <SourceBadge source={np.source} />
            <Text style={type.caption} numberOfLines={1}>
              {np.artist}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => (playing ? Media.pause() : Media.play())} hitSlop={10} accessibilityLabel={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <Pause size={22} color={colors.text} fill={colors.text} strokeWidth={icon.stroke} />
          ) : (
            <Play size={22} color={colors.text} fill={colors.text} strokeWidth={icon.stroke} />
          )}
        </Pressable>
        <Pressable onPress={() => Media.next()} hitSlop={10} accessibilityLabel="Next">
          <SkipForward size={22} color={colors.text} fill={colors.text} strokeWidth={icon.stroke} />
        </Pressable>
        <View style={styles.progress}>
          <View style={[styles.progressFill, { width: `${Math.min(1, frac) * 100}%` }]} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingBottom: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    padding: 8,
    paddingRight: 16,
    overflow: 'hidden',
  },
  text: { flex: 1, gap: 2 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progress: { position: 'absolute', left: 8, right: 8, bottom: 0, height: 2, backgroundColor: 'transparent' },
  progressFill: { height: 2, backgroundColor: colors.primary, borderRadius: 1 },
});
