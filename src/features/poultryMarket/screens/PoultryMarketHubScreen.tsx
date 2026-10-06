import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, EmptyState, Loading, useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { MarketNavCard } from '@/features/farm';
import { SubscriptionTrialCard } from '@/features/subscriptions';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { BenefitsCard } from '../components';
import { useRequestTraderRenewal, useTraderStatus, useTraderStatusQuery } from '../hooks';

/**
 * Route `/(app)/poultry/market-hub` — the market / bourse / statistics entries
 * are shown ONLY to a trader whose registration has been ACCEPTED. Every other
 * state (not registered / pending / rejected / suspended) gets an explanatory
 * screen instead — the backend also enforces trader approval on each action.
 */
export default function PoultryMarketHubScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const { t: tp } = useTranslation('poultry');
  const toast = useToast();
  const trader = useTraderStatus();
  // The live profile carries the activation period (the session snapshot does not).
  const me = useTraderStatusQuery({ enabled: trader.isApproved });
  const renewal = useRequestTraderRenewal();
  const profile = me.data?.profile ?? null;
  const subscriptionStatus = profile?.subscriptionStatus ?? 'ACTIVE';

  if (trader.isApproved && me.isPending && me.isFetching) {
    return (
      <ScrollScreen>
        <AppHeader title={tp('landing.marketTitle')} showBack />
        <Loading fill />
      </ScrollScreen>
    );
  }

  // Approved, but the activation period has ended: market access is blocked
  // (the backend refuses trader actions with TRADER_SUBSCRIPTION_EXPIRED).
  if (trader.isApproved && subscriptionStatus !== 'ACTIVE') {
    const requested = Boolean(profile?.renewalRequestedAt);
    return (
      <ScrollScreen>
        <AppHeader title={tp('landing.marketTitle')} showBack />
        <Section spacing="xl" style={{ rowGap: theme.spacing.lg }}>
          <EmptyState
            icon="hourglass-outline"
            title={t('gate.expiredTitle')}
            message={
              profile?.subscriptionEndDate
                ? t('gate.expiredBody', { date: formatDate(profile.subscriptionEndDate) })
                : t('gate.notStartedBody')
            }
          />
          <SubscriptionTrialCard subject="POULTRY_TRADER" />
          {requested ? (
            <Alert tone="info" message={t('gate.renewalPending')} />
          ) : (
            <Button
              label={t('gate.renewalCta')}
              fullWidth
              loading={renewal.isPending}
              onPress={() =>
                renewal.mutate(undefined, {
                  onSuccess: () => toast.show({ tone: 'success', message: t('gate.renewalSent') }),
                  onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
                })
              }
            />
          )}
        </Section>
      </ScrollScreen>
    );
  }

  if (!trader.isApproved) {
    return (
      <ScrollScreen>
        <AppHeader title={tp('landing.marketTitle')} showBack />
        <Section spacing="xl" style={{ rowGap: theme.spacing.lg }}>
          {trader.isPending ? (
            <>
              <EmptyState
                icon="time-outline"
                title={t('gate.pendingTitle')}
                message={t('gate.pendingBody')}
              />
              <SubscriptionTrialCard subject="POULTRY_TRADER" />
            </>
          ) : trader.isSuspended ? (
            <EmptyState icon="ban-outline" title={t('gate.suspendedTitle')} />
          ) : trader.isRejected ? (
            <>
              <EmptyState icon="close-circle-outline" title={t('gate.rejectedTitle')} />
              <Button
                label={t('gate.reapplyCta')}
                fullWidth
                onPress={() => router.push(Routes.traderRegister)}
              />
            </>
          ) : (
            <>
              <BenefitsCard />
              <Button
                label={t('gate.registerCta')}
                fullWidth
                onPress={() => router.push(Routes.traderRegister)}
              />
            </>
          )}
        </Section>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <AppHeader title={tp('landing.marketTitle')} showBack />
      {profile?.subscriptionEndDate ? (
        <Section spacing="lg">
          <Caption>
            {t('gate.activeUntil', { date: formatDate(profile.subscriptionEndDate) })}
          </Caption>
        </Section>
      ) : null}
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
    </ScrollScreen>
  );
}
