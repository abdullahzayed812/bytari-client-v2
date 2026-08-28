import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/navigation/PlaceholderScreen';

export default function AnimalsTab() {
  const { t } = useTranslation('nav');
  return <PlaceholderScreen title={t('tabs.animals')} icon="paw-outline" />;
}
