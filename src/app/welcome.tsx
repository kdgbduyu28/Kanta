import { router } from 'expo-router';
import { Play } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '../components/GradientButton';
import { SourceBadge } from '../components/SourceBadge';
import { t } from '../i18n';
import { colors, fonts, type } from '../theme';

/** PDF screen 1: logo, tagline, sources, Get Started. (No "Sign in": Kanta has no accounts.) */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.08, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse]);
  const logo = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={[styles.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.center}>
        <Animated.View style={logo}>
          <Play size={96} color={colors.text} fill={colors.text} strokeWidth={0} />
        </Animated.View>
        <Text style={styles.name}>Kanta</Text>
        <Text style={[type.body, { color: colors.textMuted }]}>{t('Your Music. All in One.')}</Text>
        <View style={styles.sources}>
          <SourceBadge source="spotify" size="md" />
          <SourceBadge source="ytmusic" size="md" />
          <SourceBadge source="applemusic" size="md" />
          <SourceBadge source="local" size="md" />
        </View>
        <Text style={[type.caption, { fontSize: 13, marginTop: 20 }]}>{t('Discover. Play. Enjoy.')}</Text>
      </View>
      <GradientButton label={t('Get Started')} onPress={() => router.replace('/setup')} />
      <Text style={[type.caption, { textAlign: 'center', marginTop: 12 }]}>
        {t('No account needed. Your music apps stay signed in as they are.')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  name: { fontFamily: fonts.bold, fontSize: 40, color: colors.text, marginTop: 24 },
  sources: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
