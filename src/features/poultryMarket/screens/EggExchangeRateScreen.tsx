import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from '@/components/actions';
import { ErrorState, Loading } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { Advertisement } from '@/features/ads';
import { useCapabilities } from '@/hooks';

import { ExchangeRateLegend, ExchangeRateTable } from '../components';
import { useEggRates } from '../hooks';

const today = () => new Date().toISOString().slice(0, 10);

/** Route `/(app)/poultry/egg-exchange-rates` — بورصة البيض (viewer). */
export default function EggExchangeRateScreen() {
  const { t } = useTranslation('poultryMarket');
  const caps = useCapabilities();
  const canManage = caps.isAdmin || caps.isSupervisorOf('MARKET') || caps.can('market.rate.manage');

  const date = today();
  const q = useEggRates(date);

  return (
    <ScrollScreen>
      <AppHeader
        title={t('exchangeRates.eggTitle')}
        showBack
        right={
          canManage ? (
            <IconButton
              icon="settings-outline"
              variant="soft"
              accessibilityLabel={t('exchangeRates.entryGear')}
              onPress={() => router.push(Routes.eggExchangeRatesEntry)}
            />
          ) : undefined
        }
      />

      <Section spacing="md">
        <Advertisement placement="EXCHANGE_RATES" />
      </Section>

      <Section spacing="md">
        <Text variant="label" color="textMuted">
          {t('exchangeRates.dateLabel', { date })}
        </Text>
      </Section>

      {q.isLoading ? (
        <Section spacing="xl">
          <Loading label={t('exchangeRates.eggTitle')} />
        </Section>
      ) : q.isError ? (
        <Section spacing="xl">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <>
          <Section spacing="sm">
            <View style={{ alignItems: 'flex-end' }}>
              <ExchangeRateLegend />
            </View>
          </Section>
          <Section spacing="xxl">
            <ExchangeRateTable board="EGG" eggEntries={q.data} showTrend />
          </Section>
        </>
      )}
    </ScrollScreen>
  );
}
