import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import { ListRow } from '../../components/ListRow';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { t, type Lang } from '../../i18n';
import { useLibrary } from '../../store/library';
import { colors } from '../../theme';

const LANGS: { id: Lang; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'fil', name: 'Filipino' },
];

export default function Language() {
  const { prefs, setPref } = useLibrary();
  return (
    <Screen>
      <ScreenHeader title={t('Language')} back />
      <View style={{ gap: 10 }}>
        {LANGS.map((l) => (
          <ListRow
            key={l.id}
            title={l.name}
            chevron={false}
            right={prefs.lang === l.id ? <Check size={20} color={colors.primary} /> : null}
            onPress={() => void setPref('lang', l.id)}
          />
        ))}
      </View>
    </Screen>
  );
}
