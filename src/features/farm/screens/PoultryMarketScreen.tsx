import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { useTheme } from '@/theme';

/**
 * "الدواجن والسوق والبورصات" placeholder — the visual slot is preserved on the
 * landing screen; this screen is a navigation placeholder until its design and
 * data source are provided. No backend is wired.
 */
export default function PoultryMarketScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  return (
    <SafeAreaScreen>
      <AppHeader title={t('market.title')} showBack />
      <View style={{ flex: 1, justifyContent: 'center', padding: theme.screenPadding }}>
        <EmptyState
          icon="trending-up-outline"
          title={t('market.comingSoonTitle')}
          message={t('market.comingSoonBody')}
        />
      </View>
    </SafeAreaScreen>
  );
}
