import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, gradient, icon as iconTok, radius, type } from '../theme';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type Props = {
  label: string;
  onPress: () => void;
  icon?: IconType;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: ViewStyle;
  right?: ReactNode;
};

/** The PDF's purple gradient "Primary Button" and its dark secondary sibling. */
export function GradientButton({ label, onPress, icon: Icon, variant = 'primary', disabled, style, right }: Props) {
  const content = (
    <View style={styles.row}>
      {Icon ? <Icon size={18} color={colors.text} strokeWidth={iconTok.stroke} /> : null}
      <Text style={styles.label}>{label}</Text>
      {right}
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [styles.base, style, { opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }]}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.fill, styles.secondary]}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.sm, overflow: 'hidden' },
  fill: { height: 48, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...type.bodyStrong, fontSize: 15 },
});
