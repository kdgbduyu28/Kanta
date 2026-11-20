import { router } from 'expo-router';
import { AudioLines, Sparkles } from 'lucide-react-native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as Media from '../../../modules/kanta-media';
import { ListRow } from '../../components/ListRow';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Slider } from '../../components/Slider';
import { Toggle } from '../../components/Toggle';
import { t } from '../../i18n';
import { matchPreset, PRESET_LABELS, type PresetId } from '../../lib/eqPresets';
import { sourceName, STREAMING } from '../../lib/sources';
import { useLibrary } from '../../store/library';
import { usePlayer } from '../../store/player';
import { colors, fonts, radius, type } from '../../theme';

export const QUALITY_LABELS = { auto: 'Auto', high: 'High Quality', lossless: 'FLAC • Lossless', hires: 'Hi-Res FLAC' } as const;

/** PDF "Settings → Playback": quality, EQ, crossfade, gapless, normalization, balance + Kanta's queue options. */
export default function PlaybackSettings() {
  const { prefs, setPref, clearHistory } = useLibrary();
  const overlay = usePlayer((s) => s.overlay);
  const a = prefs.audio;
  const setAudio = (patch: Partial<typeof a>) => void setPref('audio', { ...a, ...patch });
  const preset = matchPreset(a.eqGainsDb, prefs.eqCustomPresets);
  const presetName = preset?.startsWith('custom:') ? preset.slice(7) : preset ? t(PRESET_LABELS[preset as PresetId]) : t('Custom');

  return (
    <Screen>
      <ScreenHeader title={t('Settings')} back />
      <Text style={styles.group}>{t('PLAYBACK')}</Text>
      <Text style={[type.caption, { marginBottom: 10 }]}>{t('These apply to music on this phone. Streaming apps use their own settings.')}</Text>
      <View style={{ gap: 10 }}>
        <ListRow
          icon={Sparkles}
          title={t('Audio Quality')}
          subtitle={t('Choose your preferred sound quality')}
          note={t(QUALITY_LABELS[a.quality])}
          onPress={() => router.push('/settings/audio-quality')}
        />
        <ListRow
          icon={AudioLines}
          title={t('Equalizer')}
          subtitle={t('Customize your sound profile')}
          note={a.eqEnabled ? t('{name} EQ enabled', { name: presetName }) : t('Off')}
          onPress={() => router.push('/settings/equalizer')}
          chevron={false}
          right={<Toggle value={a.eqEnabled} onChange={(v) => setAudio({ eqEnabled: v })} label={t('Equalizer')} />}
        />
      </View>

      <Text style={styles.group}>{t('MORE AUDIO OPTIONS')}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={type.bodyStrong}>{t('Crossfade')}</Text>
          <Text style={type.caption}>{a.crossfadeSec ? t('{n} sec', { n: a.crossfadeSec }) : t('Off')}</Text>
        </View>
        <Slider value={a.crossfadeSec} min={0} max={12} step={1} onCommit={(v) => setAudio({ crossfadeSec: v })} label={t('Crossfade')} />
        <View style={styles.row}>
          <Text style={type.bodyStrong}>{t('Gapless Playback')}</Text>
          <Toggle value={a.gapless} onChange={(v) => setAudio({ gapless: v })} label={t('Gapless Playback')} />
        </View>
        <View style={styles.row}>
          <Text style={type.bodyStrong}>{t('Volume Normalization')}</Text>
          <Toggle value={a.normalize} onChange={(v) => setAudio({ normalize: v })} label={t('Volume Normalization')} />
        </View>
        <View style={styles.row}>
          <Text style={type.bodyStrong}>{t('Audio Balance')}</Text>
          <Text style={type.caption}>
            {Math.abs(a.balance) < 0.05 ? t('Center') : a.balance < 0 ? t('Left {n}%', { n: Math.round(-a.balance * 100) }) : t('Right {n}%', { n: Math.round(a.balance * 100) })}
          </Text>
        </View>
        <Slider value={a.balance} min={-1} max={1} step={0.05} centered onCommit={(v) => setAudio({ balance: v })} label={t('Audio Balance')} />
      </View>

      <Text style={styles.group}>{t('STREAMING APPS')}</Text>
      <View style={styles.card}>
        {STREAMING.map((s) => (
          <ListRow
            key={s}
            grouped
            title={t('Sound settings in {app}', { app: sourceName(s) })}
            subtitle={t('Quality and equalizer for these songs are set in that app')}
            onPress={() => Media.openInApp(s, "")}
          />
        ))}
      </View>

      <Text style={styles.group}>{t('KANTA QUEUE')}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={type.bodyStrong}>{t('Auto-advance across apps')}</Text>
            <Text style={type.caption}>{t('When a song ends, start the next one in Kanta’s queue, in whichever app it lives.')}</Text>
          </View>
          <Toggle value={prefs.autoAdvance} onChange={(v) => void setPref('autoAdvance', v)} />
        </View>
        <ListRow
          grouped
          title={t('Display over other apps')}
          subtitle={overlay ? t('Allowed: the next song starts even when the phone is locked') : t('Not allowed: you get an "Up next" notification to tap instead')}
          onPress={() => Media.openOverlaySettings()}
        />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={type.bodyStrong}>{t('Listening history')}</Text>
            <Text style={type.caption}>{t('Powers Recently Played and your stats. Kept only on this phone.')}</Text>
          </View>
          <Toggle value={prefs.historyEnabled} onChange={(v) => void setPref('historyEnabled', v)} />
        </View>
        <ListRow
          grouped
          title={t('Clear listening history')}
          chevron={false}
          onPress={() =>
            Alert.alert(t('Clear listening history?'), t('Recently Played and your listening stats start over. This cannot be undone.'), [
              { text: t('Cancel'), style: 'cancel' },
              { text: t('Clear'), style: 'destructive', onPress: () => void clearHistory() },
            ])
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, color: colors.textMuted, marginTop: 20, marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
