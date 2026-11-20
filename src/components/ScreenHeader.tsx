import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';
import { colors, icon, type } from '../theme';

type Props = { title: string; subtitle?: string; back?: boolean; right?: ReactNode };

export function ScreenHeader({ title, subtitle, back, right }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {back ? (
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={t('Back')}>
            <ChevronLeft size={26} color={colors.text} strokeWidth={icon.stroke} />
          </Pressable>
        ) : null}
        <Text style={[type.heading, styles.title]} numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
      {subtitle ? <Text style={[type.caption, { fontSize: 12 }, back && { marginLeft: 34 }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 16, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1 },
});
