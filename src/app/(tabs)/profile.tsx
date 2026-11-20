import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell, CircleHelp, Link2, Settings2, Shield, SlidersHorizontal } from 'lucide-react-native';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { GradientButton } from '../../components/GradientButton';
import { ListRow } from '../../components/ListRow';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { t } from '../../i18n';
import { compactCount, formatHours } from '../../lib/stats';
import { useLibrary } from '../../store/library';
import { colors, fonts, gradient, type } from '../../theme';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '♪';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export default function Profile() {
  const { prefs, playlists, tracks, listeningMs } = useLibrary();
  return (
    <Screen tab>
      <ScreenHeader
        title={t('Profile')}
        right={
          <Pressable onPress={() => router.push('/settings')} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('Settings')}>
            <Settings2 size={22} color={colors.text} strokeWidth={1.8} />
          </Pressable>
        }
      />
      <View style={styles.center}>
        <LinearGradient colors={gradient.primary} style={styles.avatar}>
          <Text style={styles.initials}>{initials(prefs.name)}</Text>
        </LinearGradient>
        <Text style={[type.title, { marginTop: 12 }]}>{prefs.name || t('Music lover')}</Text>
        <Text style={type.caption}>{t('Everything stays on this phone')}</Text>
      </View>

      <View style={styles.stats}>
        <Stat value={compactCount(playlists.length)} label={t('Playlists')} />
        <Stat value={compactCount(tracks.length)} label={t('Songs')} />
        <Stat value={formatHours(listeningMs)} label={t('Listening')} />
      </View>

      <GradientButton label={t('Edit Profile')} onPress={() => router.push('/profile-edit')} />

      <View style={styles.list}>
        <ListRow grouped icon={Link2} title={t('Connected Accounts')} subtitle={t('Spotify, YouTube Music, Apple Music, this phone')} onPress={() => router.push('/sources')} />
        <ListRow grouped icon={SlidersHorizontal} title={t('Playback & Audio')} onPress={() => router.push('/settings/playback')} />
        <ListRow grouped icon={Bell} title={t('Notifications')} onPress={() => router.push('/settings/notifications')} />
        <ListRow grouped icon={Shield} title={t('Privacy')} onPress={() => router.push('/settings/privacy')} />
        <ListRow
          grouped
          icon={CircleHelp}
          title={t('Help & Support')}
          onPress={() => void Linking.openURL('https://github.com/kdgbduyu28/Kanta#readme')}
        />
      </View>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[type.heading, { fontSize: 20 }]}>{value}</Text>
      <Text style={type.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginTop: 8 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: fonts.bold, fontSize: 28, color: colors.text },
  stats: { flexDirection: 'row', marginVertical: 24 },
  list: { marginTop: 20 },
});
