import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GradientButton } from '../components/GradientButton';
import { Screen } from '../components/Screen';
import { SourcesList } from '../components/SourcesList';
import { t } from '../i18n';
import { requestNotificationPermission } from '../lib/permissions';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { colors, fonts, radius, type } from '../theme';

/** First run: connect the apps (notification access, music files), then a name for the greeting. */
export default function Setup() {
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState('');
  const access = usePlayer((s) => s.access);
  const setPref = useLibrary((s) => s.setPref);

  const finish = async () => {
    if (name.trim()) await setPref('name', name.trim());
    await requestNotificationPermission();
    await setPref('setupDone', true);
    router.replace('/');
  };

  return (
    <Screen>
      <Text style={styles.step}>{t('Step {n} of 2', { n: step + 1 })}</Text>
      {step === 0 ? (
        <Animated.View entering={FadeIn} style={{ gap: 16 }}>
          <Text style={type.display}>{t('Connect your music apps')}</Text>
          <Text style={[type.body, { color: colors.textMuted }]}>
            {t('Kanta draws one library and one queue. Your music apps play the songs, so you keep full songs, background play and lock-screen controls.')}
          </Text>
          <SourcesList compact />
          <GradientButton label={access ? t('Continue') : t('Skip for now')} variant={access ? 'primary' : 'secondary'} onPress={() => setStep(1)} />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn} style={{ gap: 16 }}>
          <Text style={type.display}>{t('What should we call you?')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('Your name (optional)')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            onSubmitEditing={finish}
          />
          <GradientButton label={t('Start listening')} onPress={finish} />
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, color: colors.primary, marginBottom: 12, marginTop: 16 },
  input: { height: 52, borderRadius: radius.sm, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 16, fontFamily: fonts.regular, fontSize: 16 },
});
