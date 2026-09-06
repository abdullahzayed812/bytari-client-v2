import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { MarketNavCard } from '@/features/farm';
import { useTheme } from '@/theme';

import { BenefitsCard } from '../components';
import { useTraderStatus } from '../hooks';

/** Route `/(app)/poultry/market-hub` — trader-gated entry to the market/bourse/statistics screens. */
export default function PoultryMarketHubScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const { t: tp } = useTranslation('poultry');
  const trader = useTraderStatus();

  return (
    <ScrollScreen>
      <AppHeader title={tp('landing.marketTitle')} showBack />

      {!trader.hasRegistered ? (
        <Section spacing="xl" style={{ rowGap: theme.spacing.lg }}>
          <BenefitsCard />
          <Button
            label={t('gate.registerCta')}
            fullWidth
            onPress={() => router.push(Routes.traderRegister)}
          />
        </Section>
      ) : (
        <Section spacing="xl">
          <View style={{ rowGap: theme.spacing.md }}>
            <MarketNavCard
              icon="trending-up-outline"
              title={tp('landing.hubPoultryMarketTitle')}
              subtitle={tp('landing.hubPoultryMarketSubtitle')}
              onPress={() => router.push(Routes.poultryMarket)}
            />
            <MarketNavCard
              icon="egg-outline"
              title={tp('landing.eggMarketTitle')}
              subtitle={tp('landing.eggMarketSubtitle')}
              onPress={() => router.push(Routes.eggMarket)}
            />
            <MarketNavCard
              icon="bar-chart-outline"
              title={tp('landing.poultryBourseTitle')}
              subtitle={tp('landing.poultryBourseSubtitle')}
              onPress={() => router.push(Routes.poultryExchangeRates)}
            />
            <MarketNavCard
              icon="stats-chart-outline"
              title={tp('landing.eggBourseTitle')}
              subtitle={tp('landing.eggBourseSubtitle')}
              onPress={() => router.push(Routes.eggExchangeRates)}
            />
            <MarketNavCard
              icon="analytics-outline"
              title={tp('landing.statisticsTitle')}
              subtitle={tp('landing.statisticsSubtitle')}
              onPress={() => router.push(Routes.marketStatistics)}
            />
          </View>
        </Section>
      )}
    </ScrollScreen>
  );
}
