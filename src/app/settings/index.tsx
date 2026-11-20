import { router } from 'expo-router';
import { Bell, Globe, Link2, Mail, Moon, Shield, SlidersHorizontal } from 'lucide-react-native';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { ListRow } from '../../components/ListRow';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { t } from '../../i18n';
import { CONTACTS, mailtoUrl } from '../../lib/contact';
import { useLibrary } from '../../store/library';
import { colors, fonts, type } from '../../theme';

const styles = StyleSheet.create({
  group: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, color: colors.textMuted, marginTop: 24, marginBottom: 6 },
});

export default function Settings() {
  const lang = useLibrary((s) => s.prefs.lang);
  return (
    <Screen>
      <ScreenHeader title={t('Settings')} subtitle={t('Personalize your Kanta experience')} back />
      <View style={{ gap: 10 }}>
        <ListRow icon={SlidersHorizontal} title={t('Playback & Audio')} subtitle={t('Quality, equalizer, crossfade, auto-advance')} onPress={() => router.push('/settings/playback')} />
        <ListRow icon={Link2} title={t('Sources')} subtitle={t('Spotify, YouTube Music, Apple Music, this phone')} onPress={() => router.push('/sources')} />
        <ListRow icon={Bell} title={t('Notifications')} subtitle={t('Manage alerts')} onPress={() => router.push('/settings/notifications')} />
        <ListRow icon={Moon} title={t('Appearance')} subtitle={t('Dark theme')} />
        <ListRow icon={Globe} title={t('Language')} subtitle={lang === 'fil' ? 'Filipino' : 'English'} onPress={() => router.push('/settings/language')} />
        <ListRow icon={Shield} title={t('Privacy')} subtitle={t('What Kanta reads and keeps')} onPress={() => router.push('/settings/privacy')} />
      </View>

      <Text style={styles.group}>{t('CONTACT')}</Text>
      <Text style={[type.caption, { marginBottom: 10 }]}>{t('A bug, a missing feature or an idea? Email us.')}</Text>
      <View style={{ gap: 10 }}>
        {CONTACTS.map((c) => (
          <ListRow
            key={c.email}
            icon={Mail}
            title={c.name}
            subtitle={c.email}
            onPress={() => void Linking.openURL(mailtoUrl(c.email)).catch(() => {})}
          />
        ))}
      </View>
    </Screen>
  );
}
