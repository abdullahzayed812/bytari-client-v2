import type { ListEggOffersFilter, ListPoultryOffersFilter } from '../types';

/** Poultry Markets query keys. Trader status/profile is a per-USER concept — no organizationId anywhere. */
export const poultryMarketKeys = {
  traderStatus: ['market', 'trader', 'me'] as const,
  traderAdminList: (status: string | undefined) =>
    ['market', 'trader', 'admin', 'list', status] as const,

  poultryOffers: {
    all: ['market', 'poultry-offers'] as const,
    list: (filter: Omit<ListPoultryOffersFilter, 'page'>) =>
      ['market', 'poultry-offers', 'list', filter] as const,
    mine: ['market', 'poultry-offers', 'mine'] as const,
    detail: (offerId: string) => ['market', 'poultry-offers', 'detail', offerId] as const,
    adminList: (filter: Omit<ListPoultryOffersFilter, 'page'>) =>
      ['market', 'poultry-offers', 'admin', 'list', filter] as const,
  },

  eggOffers: {
    all: ['market', 'egg-offers'] as const,
    list: (filter: Omit<ListEggOffersFilter, 'page'>) =>
      ['market', 'egg-offers', 'list', filter] as const,
    mine: ['market', 'egg-offers', 'mine'] as const,
    detail: (offerId: string) => ['market', 'egg-offers', 'detail', offerId] as const,
    adminList: (filter: Omit<ListEggOffersFilter, 'page'>) =>
      ['market', 'egg-offers', 'admin', 'list', filter] as const,
  },

  exchangeRates: {
    poultry: (date: string) => ['market', 'exchange-rates', 'poultry', date] as const,
    egg: (date: string) => ['market', 'exchange-rates', 'egg', date] as const,
  },

  statistics: ['market', 'statistics'] as const,
};
