import { MoreHorizontal, Play } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Source } from '../../modules/kanta-media/src/types';
import { colors, icon, type } from '../theme';
import { Artwork } from './Artwork';
import { SourceBadge } from './SourceBadge';

type Props = {
  title: string;
  artist: string;
  source: Source;
  artworkUri?: string | null;
  onPress: () => void;
  onMore?: () => void;
  playing?: boolean;
  /** Search's trending-style rows end with a play arrow instead of ⋯. */
  trailingPlay?: boolean;
  showArtwork?: boolean;
};

export function TrackRow({ title, artist, source, artworkUri, onPress, onMore, playing, trailingPlay, showArtwork = true }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]} accessibilityRole="button">
      {showArtwork ? <Artwork uri={artworkUri} size={44} radius={8} /> : null}
      <View style={styles.text}>
        <Text style={[type.bodyStrong, playing && { color: colors.primary }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.sub}>
          <SourceBadge source={source} />
          <Text style={type.caption} numberOfLines={1}>
            {artist}
          </Text>
        </View>
      </View>
      {trailingPlay ? (
        <Play size={18} color={colors.text} fill={colors.text} strokeWidth={icon.stroke} />
      ) : onMore ? (
        <Pressable onPress={onMore} hitSlop={12} accessibilityLabel="More">
          <MoreHorizontal size={20} color={colors.textMuted} strokeWidth={icon.stroke} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  text: { flex: 1, gap: 3 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
