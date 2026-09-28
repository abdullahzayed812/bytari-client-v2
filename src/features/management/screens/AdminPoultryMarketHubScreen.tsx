import { useTranslation } from 'react-i18next';

import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';

import { AdminHubScreen } from '../components/AdminHubScreen';

/**
 * Route `/admin/poultry-market-hub` — "سوق الدواجن" in Admin management:
 * trader registrations, poultry / egg advertisement moderation, the poultry
 * and egg exchange-rate boards, and poultry farms. Each entry is shown only to
 * a caller holding its permission (the backend enforces the same keys).
 */
export default function AdminPoultryMarketHubScreen() {
  const { t: ta } = useTranslation('admin');
  const caps = useCapabilities();
  const canTraders = caps.isAdmin || caps.can('trader.admin.read');
  const canOffers =
    caps.isAdmin || caps.isSupervisorOf('MARKET') || caps.can('market.offer.admin.read');
  const canRates = caps.isAdmin || caps.isSupervisorOf('MARKET') || caps.can('market.rate.manage');
  const canFarms = caps.isAdmin || caps.can('organization.admin.read');

  const entries = [
    canTraders && {
      key: 'traders',
      label: ta('traders.title'),
      icon: 'people-outline' as const,
      route: Routes.adminTraderApplications,
    },
    canOffers && {
      key: 'poultryOffers',
      label: ta('hubs.poultryMarket.poultryOffers'),
      icon: 'nutrition-outline' as const,
      route: Routes.adminMarketOffers('poultry'),
    },
    canOffers && {
      key: 'eggOffers',
      label: ta('hubs.poultryMarket.eggOffers'),
      icon: 'egg-outline' as const,
      route: Routes.adminMarketOffers('egg'),
    },
    canRates && {
      key: 'poultryRates',
      label: ta('hubs.poultryMarket.poultryRates'),
      icon: 'trending-up-outline' as const,
      route: Routes.poultryExchangeRatesEntry,
    },
    canRates && {
      key: 'eggRates',
      label: ta('hubs.poultryMarket.eggRates'),
      icon: 'stats-chart-outline' as const,
      route: Routes.eggExchangeRatesEntry,
    },
    canFarms && {
      key: 'farms',
      label: ta('hubs.poultryMarket.farms'),
      icon: 'leaf-outline' as const,
      route: { pathname: Routes.adminFarms, params: { species: 'POULTRY' } },
    },
  ].filter((e): e is Exclude<typeof e, false> => Boolean(e));

  return (
    <AdminHubScreen
      title={ta('hubs.poultryMarket.title')}
      intro={ta('hubs.poultryMarket.intro')}
      entries={entries}
    />
  );
}
