import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { GradientButton } from '../components/GradientButton';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { t } from '../i18n';
import { useLibrary } from '../store/library';
import { colors, fonts, radius, type } from '../theme';

export default function ProfileEdit() {
  const { prefs, setPref } = useLibrary();
  const [name, setName] = useState(prefs.name);
  return (
    <Screen>
      <ScreenHeader title={t('Edit Profile')} back />
      <Text style={[type.caption, { marginBottom: 6 }]}>{t('Name')}</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholder={t('Your name')} placeholderTextColor={colors.textMuted} />
      <Text style={[type.caption, { marginVertical: 12 }]}>{t('Your initials are your picture. Everything stays on this phone.')}</Text>
      <GradientButton
        label={t('Save')}
        onPress={async () => {
          await setPref('name', name.trim());
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { height: 52, borderRadius: radius.sm, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 16, fontFamily: fonts.regular, fontSize: 16 },
});
