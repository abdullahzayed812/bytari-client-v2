import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/navigation/PlaceholderScreen';

export default function ServicesTab() {
  const { t } = useTranslation('nav');
  return <PlaceholderScreen title={t('tabs.services')} icon="grid-outline" />;
}
