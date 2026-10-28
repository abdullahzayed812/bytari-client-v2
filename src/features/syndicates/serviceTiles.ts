import type { IconName } from '@/components/content';

import type { SyndicateServiceItem, SyndicateServiceKey } from './types';

/** Built-in look of each syndicate service — the default title, icon and where its tile leads. */
export const SYNDICATE_SERVICE_TILES: readonly {
  serviceKey: SyndicateServiceKey;
  labelKey: string;
  icon: IconName;
  route:
    'idRequirements' | 'inquiry' | 'announcements' | 'register' | 'legalSupport' | 'officeLicenses';
}[] = [
  {
    serviceKey: 'ID_CARD',
    labelKey: 'home.servicesTiles.idCard',
    icon: 'card-outline',
    route: 'idRequirements',
  },
  {
    serviceKey: 'INQUIRY',
    labelKey: 'home.servicesTiles.inquiry',
    icon: 'chatbubble-ellipses-outline',
    route: 'inquiry',
  },
  {
    serviceKey: 'ANNOUNCEMENTS',
    labelKey: 'home.servicesTiles.announcements',
    icon: 'megaphone-outline',
    route: 'announcements',
  },
  {
    serviceKey: 'REGISTER_DOCTORS',
    labelKey: 'home.servicesTiles.registerDoctors',
    icon: 'person-add-outline',
    route: 'register',
  },
  {
    serviceKey: 'LEGAL_SUPPORT',
    labelKey: 'home.servicesTiles.legalSupport',
    icon: 'scale-outline',
    route: 'legalSupport',
  },
  {
    serviceKey: 'OFFICE_LICENSES',
    labelKey: 'home.servicesTiles.officeLicenses',
    icon: 'business-outline',
    route: 'officeLicenses',
  },
];

export function serviceTileFor(key: SyndicateServiceKey) {
  return SYNDICATE_SERVICE_TILES.find((tile) => tile.serviceKey === key);
}

/** The saved service of `key` (custom title / description / visibility), if loaded. */
export function findService(
  services: SyndicateServiceItem[] | undefined,
  key: SyndicateServiceKey,
): SyndicateServiceItem | undefined {
  return services?.find((s) => s.serviceKey === key);
}
