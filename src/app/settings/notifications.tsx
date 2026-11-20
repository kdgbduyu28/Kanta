import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Toggle } from '../../components/Toggle';
import { t } from '../../i18n';
import { requestNotificationPermission } from '../../lib/permissions';
import { useLibrary } from '../../store/library';
import { colors, radius, type } from '../../theme';

export default function NotificationSettings() {
  const { prefs, setPref } = useLibrary();
  return (
    <Screen>
      <ScreenHeader title={t('Notifications')} back subtitle={t('Manage alerts')} />
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={type.bodyStrong}>{t('Up next')}</Text>
          <Text style={type.caption}>
            {t('When Android won’t let Kanta open the next song from the background, show a notification you tap to play it.')}
          </Text>
        </View>
        <Toggle
          value={prefs.upNextNotifications}
          onChange={async (v) => {
            if (v) await requestNotificationPermission();
            await setPref('upNextNotifications', v);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16 },
});
