import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SourcesList } from '../components/SourcesList';
import { t } from '../i18n';

export default function Sources() {
  return (
    <Screen>
      <ScreenHeader title={t('Sources')} subtitle={t('The music apps Kanta works with')} back />
      <SourcesList />
    </Screen>
  );
}
