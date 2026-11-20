import { StyleSheet, Text, View } from 'react-native';
import * as Media from '../../../modules/kanta-media';
import { GradientButton } from '../../components/GradientButton';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { t } from '../../i18n';
import { colors, radius, type } from '../../theme';

const POINTS = [
  'Kanta reads only media info from your music apps: song, artist, album, cover and position. It does not read your other notifications.',
  'Your library, playlists and listening history are stored only on this phone. Kanta has no account and no server.',
  'Kanta never signs in to Spotify, YouTube Music or Apple Music. It opens songs in those apps and presses play, pause and skip for you.',
  'Song details and lyrics are looked up from public pages (Spotify, YouTube, Apple Music) and LRCLIB when you save or open a song.',
];

export default function Privacy() {
  return (
    <Screen>
      <ScreenHeader title={t('Privacy')} back subtitle={t('What Kanta reads and keeps')} />
      <View style={styles.card}>
        {POINTS.map((p) => (
          <Text key={p} style={[type.body, { color: colors.textMuted }]}>
            • {t(p)}
          </Text>
        ))}
      </View>
      <GradientButton
        label={t('Turn off notification access')}
        variant="secondary"
        style={{ marginTop: 20 }}
        onPress={() => Media.openNotificationAccessSettings()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, gap: 12 },
});
