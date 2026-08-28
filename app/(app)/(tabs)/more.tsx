import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/navigation/PlaceholderScreen';

export default function MoreTab() {
  const { t } = useTranslation('nav');
  return <PlaceholderScreen title={t('tabs.more')} icon="ellipsis-horizontal" />;
}
