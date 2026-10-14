import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, ErrorState, Loading, useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { Advertisement } from '@/features/ads';
import { SubscriptionTrialCard } from '@/features/subscriptions';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  MarketAccessChoice,
  MarketFarmEntryCard,
  MarketFeatureTile,
  MarketWideCard,
} from '../components';
import { useMarketAccess, useRequestTraderRenewal } from '../hooks';
import type { MarketAccess } from '../types';

/**
 * Route `/(app)/poultry/market-hub` — "السوق وبورصات الدواجن". What it shows
 * comes from `GET /poultry-market/access`, where the merchant account and each
 * owned poultry farm are evaluated INDEPENDENTLY on the server:
 *  - no eligible account → the account-choice screen (register as a merchant
 *    / create a poultry farm — both reuse the existing flows) with a notice
 *    per pending / expired / suspended account and its renewal path;
 *  - otherwise → the markets: the TRADER_REGISTRATION ad, the poultry farm
 *    card (eligible farm owners) or "add a farm", the 2×2 markets/bourses
 *    grid and statistics.
 * The backend refuses every market API the same way — hiding a card is never
 * the enforcement.
 */
export default function PoultryMarketHubScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const access = useMarketAccess();

  const header = <AppHeader title={t('access.title')} showBack />;

  if (access.isPending) {
    return (
      <ScrollScreen>
        {header}
        <Loading fill />
      </ScrollScreen>
    );
  }
  if (access.isError || !access.data) {
    return (
      <ScrollScreen>
        {header}
        <Section spacing="xl">
          <ErrorState error={access.error} onRetry={() => void access.refetch()} />
        </Section>
      </ScrollScreen>
    );
  }

  const a = access.data;
  const notices = <AccountNotices access={a} />;

  if (!a.sections.markets) {
    const canApply = a.merchant.reason === 'NOT_REGISTERED' || a.merchant.reason === 'REJECTED';
    return (
      <ScrollScreen>
        {header}
        <Section spacing="lg">
          <MarketAccessChoice
            notices={notices}
            onCreateFarm={() => router.push(Routes.poultryFarmCreate)}
            onRegisterMerchant={canApply ? () => router.push(Routes.traderRegister) : undefined}
          />
        </Section>
      </ScrollScreen>
    );
  }

  const eligibleFarms = a.farms.filter((f) => f.eligible);
  const [onlyFarm] = eligibleFarms;

  return (
    <ScrollScreen>
      {header}
      <Section spacing="lg" style={{ rowGap: theme.spacing.md }}>
        <Advertisement placement="TRADER_REGISTRATION" />

        {a.sections.poultryFarm ? (
          <MarketFarmEntryCard
            variant="farm"
            title={
              eligibleFarms.length === 1 && onlyFarm ? onlyFarm.name : t('access.card.myFarmsTitle')
            }
            subtitle={t('access.card.myFarmSubtitle')}
            onPress={() =>
              eligibleFarms.length === 1 && onlyFarm
                ? router.push(Routes.poultryFarmDetail(onlyFarm.organizationId))
                : router.push(Routes.poultryFarms)
            }
          />
        ) : (
          <MarketFarmEntryCard
            variant="add"
            title={t('access.farm.title')}
            subtitle={t('access.card.addFarmSubtitle')}
            onPress={() => router.push(Routes.poultryFarmCreate)}
          />
        )}

        {notices}

        {a.merchant.eligible && a.merchant.subscriptionEndDate ? (
          <Caption>
            {t('gate.activeUntil', { date: formatDate(a.merchant.subscriptionEndDate) })}
          </Caption>
        ) : null}

        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <MarketFeatureTile
            icon="storefront-outline"
            iconColor="primary"
            iconSurface="dashboardMintSurface"
            title={t('access.card.poultryMarketTitle')}
            subtitle={t('access.card.poultryMarketSubtitle')}
            onPress={() => router.push(Routes.poultryMarket)}
          />
          <MarketFeatureTile
            icon="egg-outline"
            iconColor="dashboardAmberAccent"
            iconSurface="dashboardAmberSurface"
            title={t('access.card.eggMarketTitle')}
            subtitle={t('access.card.eggMarketSubtitle')}
            onPress={() => router.push(Routes.eggMarket)}
          />
        </View>
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <MarketFeatureTile
            icon="trending-up-outline"
            iconColor="dashboardRoseAccent"
            iconSurface="dashboardRoseSurface"
            title={t('access.card.poultryBourseTitle')}
            subtitle={t('access.card.poultryBourseSubtitle')}
            onPress={() => router.push(Routes.poultryExchangeRates)}
          />
          <MarketFeatureTile
            icon="bar-chart-outline"
            iconColor="dashboardBlueAccent"
            iconSurface="dashboardBlueSurface"
            title={t('access.card.eggBourseTitle')}
            subtitle={t('access.card.eggBourseSubtitle')}
            onPress={() => router.push(Routes.eggExchangeRates)}
          />
        </View>
        <MarketWideCard
          icon="pie-chart-outline"
          title={t('access.card.statisticsTitle')}
          subtitle={t('access.card.statisticsSubtitle')}
          onPress={() => router.push(Routes.marketStatistics)}
        />
      </Section>
    </ScrollScreen>
  );
}

/**
 * One notice per REGISTERED account that does not currently grant access —
 * why, and the existing renewal path (trader renewal request / farm
 * subscription renewal). An eligible account needs no notice.
 */
function AccountNotices({ access }: { access: MarketAccess }) {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const toast = useToast();
  const renewal = useRequestTraderRenewal();
  const m = access.merchant;

  const items: ReactNode[] = [];

  if (m.reason === 'PENDING_APPROVAL') {
    items.push(
      <View key="merchant" style={{ rowGap: theme.spacing.sm }}>
        <Alert tone="info" message={t('access.status.merchantPending')} />
        <SubscriptionTrialCard subject="POULTRY_TRADER" />
      </View>,
    );
  } else if (m.reason === 'REJECTED') {
    items.push(
      <Alert key="merchant" tone="warning" message={t('access.status.merchantRejected')} />,
    );
  } else if (m.reason === 'SUSPENDED') {
    items.push(
      <Alert key="merchant" tone="danger" message={t('access.status.merchantSuspended')} />,
    );
  } else if (m.reason === 'SUBSCRIPTION_NOT_STARTED') {
    items.push(
      <Alert key="merchant" tone="info" message={t('access.status.merchantNotStarted')} />,
    );
  } else if (m.reason === 'SUBSCRIPTION_EXPIRED') {
    items.push(
      <View key="merchant" style={{ rowGap: theme.spacing.sm }}>
        <Alert
          tone="warning"
          message={t('access.status.merchantExpired', {
            date: m.subscriptionEndDate ? formatDate(m.subscriptionEndDate) : '',
          })}
        />
        <SubscriptionTrialCard subject="POULTRY_TRADER" />
        {m.renewalRequestedAt ? (
          <Alert tone="info" message={t('gate.renewalPending')} />
        ) : (
          <Button
            label={t('gate.renewalCta')}
            variant="outline"
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
      </View>,
    );
  }

  for (const f of access.farms) {
    if (f.eligible) continue;
    const date = f.subscriptionEndDate ? formatDate(f.subscriptionEndDate) : '';
    const message =
      f.reason === 'PENDING_APPROVAL'
        ? t('access.status.farmPending', { name: f.name })
        : f.reason === 'SUBSCRIPTION_EXPIRED'
          ? t('access.status.farmExpired', { name: f.name, date })
          : f.reason === 'SUBSCRIPTION_NOT_STARTED'
            ? t('access.status.farmNotStarted', { name: f.name })
            : t('access.status.farmInactive', { name: f.name });
    items.push(
      <View key={f.organizationId} style={{ rowGap: theme.spacing.sm }}>
        <Alert tone={f.reason === 'PENDING_APPROVAL' ? 'info' : 'warning'} message={message} />
        {f.reason === 'SUBSCRIPTION_EXPIRED' ? (
          <Button
            label={t('access.status.farmRenewCta')}
            variant="outline"
            fullWidth
            onPress={() => router.push(Routes.farmSubscriptionRenewal(f.organizationId))}
          />
        ) : null}
      </View>,
    );
  }

  if (items.length === 0) return null;
  return <View style={{ rowGap: theme.spacing.md }}>{items}</View>;
}
