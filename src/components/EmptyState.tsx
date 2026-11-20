import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';
import { GradientButton } from './GradientButton';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export type EmptyStateProps = {
  icon?: IconType;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {Icon ? (
        <View style={styles.icon}>
          <Icon size={28} color={colors.primary} strokeWidth={1.8} />
        </View>
      ) : null}
      <Text style={[type.title, styles.center]}>{title}</Text>
      <Text style={[type.body, styles.center, { color: colors.textMuted }]}>{body}</Text>
      {action ? <GradientButton label={action.label} onPress={action.onPress} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 8 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(168,85,247,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  center: { textAlign: 'center' },
});
