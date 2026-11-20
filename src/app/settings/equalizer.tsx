import { RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip } from '../../components/Chip';
import { EqBands } from '../../components/EqBands';
import { GradientButton } from '../../components/GradientButton';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Toggle } from '../../components/Toggle';
import { t } from '../../i18n';
import { clampDb, EQ_PRESETS, matchPreset, PRESET_LABELS, PRESET_ORDER } from '../../lib/eqPresets';
import { useLibrary } from '../../store/library';
import { toast } from '../../store/toast';
import { colors, fonts, radius, type } from '../../theme';

/** PDF "Equalizer": toggle, preset chips, 9 bands ±12 dB, Reset / Save Preset. */
export default function Equalizer() {
  const { prefs, setPref } = useLibrary();
  const a = prefs.audio;
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const current = matchPreset(a.eqGainsDb, prefs.eqCustomPresets);
  const setGains = (g: number[]) => void setPref('audio', { ...a, eqGainsDb: g.map(clampDb), eqEnabled: true });

  return (
    <Screen>
      <ScreenHeader title={t('Equalizer')} back subtitle={t('Shape your sound to match your taste.')} />
      <View style={styles.row}>
        <Text style={type.bodyStrong}>{t('Enable Equalizer')}</Text>
        <Toggle value={a.eqEnabled} onChange={(v) => void setPref('audio', { ...a, eqEnabled: v })} label={t('Enable Equalizer')} />
      </View>

      <Text style={styles.group}>{t('PRESETS')}</Text>
      <View style={styles.chips}>
        <Chip label={t('Custom')} active={current == null} onPress={() => setNaming(true)} />
        {PRESET_ORDER.map((p) => (
          <Chip key={p} label={t(PRESET_LABELS[p])} active={current === p} onPress={() => setGains(EQ_PRESETS[p])} />
        ))}
        {prefs.eqCustomPresets.map((c) => (
          <Chip key={c.name} label={c.name} active={current === `custom:${c.name}`} onPress={() => setGains(c.gainsDb)} />
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <EqBands
          gainsDb={a.eqGainsDb}
          disabled={!a.eqEnabled}
          onChange={(i, db) => setGains(a.eqGainsDb.map((g, j) => (j === i ? db : g)))}
        />
      </View>

      <View style={styles.buttons}>
        <GradientButton label={t('Reset')} icon={RotateCcw} variant="secondary" style={{ flex: 1 }} onPress={() => setGains(EQ_PRESETS.flat)} />
        <GradientButton label={t('Save Preset')} style={{ flex: 1 }} onPress={() => setNaming(true)} />
      </View>
      <Text style={[type.caption, { marginTop: 14 }]}>{t('Adjust each band, then save your custom profile.')}</Text>
      <Text style={type.caption}>{t('The equalizer works on music on this phone. Spotify, YouTube Music and Apple Music have their own.')}</Text>

      <Modal transparent visible={naming} animationType="fade" onRequestClose={() => setNaming(false)}>
        <Pressable style={styles.backdrop} onPress={() => setNaming(false)} />
        <View style={styles.dialog}>
          <Text style={type.title}>{t('Save Preset')}</Text>
          <TextInput value={name} onChangeText={setName} autoFocus placeholder={t('Preset name')} placeholderTextColor={colors.textMuted} style={styles.input} />
          <GradientButton
            label={t('Save')}
            disabled={!name.trim()}
            onPress={async () => {
              const n = name.trim();
              const rest = prefs.eqCustomPresets.filter((c) => c.name !== n);
              await setPref('eqCustomPresets', [...rest, { name: n, gainsDb: a.eqGainsDb }]);
              setName('');
              setNaming(false);
              toast(t('Saved "{name}"', { name: n }));
            }}
          />
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.md, padding: 16 },
  group: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, color: colors.textMuted, marginTop: 20, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  dialog: { position: 'absolute', left: 24, right: 24, top: '30%', backgroundColor: colors.surface, borderRadius: radius.md, padding: 20, gap: 14 },
  input: { height: 48, borderRadius: radius.sm, backgroundColor: colors.surfaceSunken, color: colors.text, paddingHorizontal: 12, fontFamily: fonts.regular },
});
