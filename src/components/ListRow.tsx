import { ChevronRight } from 'lucide-react-native';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, icon as iconTok, radius, type } from '../theme';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type Props = {
  title: string;
  subtitle?: string;
  /** Purple caption under the subtitle, like "FLAC • Lossless" in the PDF. */
  note?: string;
  icon?: IconType;
  right?: ReactNode;
  onPress?: () => void;
  /** Rows inside a grouped card drop their own background. */
  grouped?: boolean;
  chevron?: boolean;
};

/** Settings/library row on a dark card with a chevron (PDF Settings, Profile). */
export function ListRow({ title, subtitle, note, icon: Icon, right, onPress, grouped, chevron = !!onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, !grouped && styles.card, pressed && { opacity: 0.8 }]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {Icon ? (
        <View style={styles.iconWrap}>
          <Icon size={iconTok.size} color={colors.primary} strokeWidth={iconTok.stroke} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={type.bodyStrong} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={type.caption} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {note ? <Text style={[type.caption, { color: colors.primary, marginTop: 2 }]}>{note}</Text> : null}
      </View>
      {right}
      {chevron ? <ChevronRight size={18} color={colors.textMuted} strokeWidth={iconTok.stroke} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radius.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
});
