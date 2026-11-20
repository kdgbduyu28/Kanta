import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { QualityMode } from '../../../modules/kanta-media';
import { GradientButton } from '../../components/GradientButton';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { t } from '../../i18n';
import { useLibrary } from '../../store/library';
import { toast } from '../../store/toast';
import { colors, fonts, radius, type } from '../../theme';

const OPTIONS: { id: QualityMode; title: string; body: string }[] = [
  { id: 'auto', title: 'Auto', body: 'Adjust quality automatically' },
  { id: 'high', title: 'High Quality', body: '16-bit / 48 kHz • safe for Bluetooth' },
  { id: 'lossless', title: 'FLAC Lossless', body: "Plays each file at its own rate • compatible files" },
  { id: 'hires', title: 'Hi-Res FLAC', body: 'Up to 24-bit / 192 kHz*' },
];

/** PDF "Audio Quality": four cards, Apply Quality. Applies to music on this phone. */
export default function AudioQuality() {
  const { prefs, setPref } = useLibrary();
  const [picked, setPicked] = useState<QualityMode>(prefs.audio.quality);
  return (
    <Screen>
      <ScreenHeader title={t('Audio Quality')} back subtitle={t('Select the best quality supported by your source.')} />
      <View style={{ gap: 12 }}>
        {OPTIONS.map((o) => {
          const on = picked === o.id;
          return (
            <Pressable key={o.id} style={[styles.card, on && styles.cardOn]} onPress={() => setPicked(o.id)} accessibilityRole="radio" accessibilityState={{ checked: on }}>
              <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.dot} /> : null}</View>
              <View style={{ flex: 1 }}>
                <Text style={type.bodyStrong}>{t(o.title)}</Text>
                <Text style={type.caption}>{t(o.body)}</Text>
              </View>
              {on ? <Text style={styles.tag}>{t('SELECTED')}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={[type.caption, { marginTop: 16 }]}>
        {t('*Only when the audio file, device and output path support this resolution. Bit-perfect output needs a USB DAC on Android 14 or newer. Streaming apps set their own quality.')}
      </Text>
      <GradientButton
        label={t('Apply Quality')}
        style={{ marginTop: 24 }}
        onPress={async () => {
          await setPref('audio', { ...prefs.audio, quality: picked });
          toast(t('Quality applied'));
          router.back();
        }}
      />
      <Text style={[type.caption, { textAlign: 'center', marginTop: 10 }]}>{t('Changes apply to music on this phone.')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: 'transparent' },
  cardOn: { borderColor: colors.primary, backgroundColor: 'rgba(168,85,247,0.12)' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  tag: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 0.8, color: colors.text, backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
});
