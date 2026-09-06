import type { IconName } from '@/components/content';

import type { BirdType, EggType, PricingMethod, SellUnit, TraderType } from './types';

/** Bird type → line icon + ordered list for the poultry-market tile pickers/filters. */
export const BIRD_TYPE_ICON: Record<BirdType, IconName> = {
  BALADI: 'paw-outline',
  LAYER: 'egg-outline',
  BROILER: 'restaurant-outline',
  ROOSTER: 'paw-outline',
  TURKEY: 'paw-outline',
  OTHER: 'help-circle-outline',
};
export const BIRD_TYPE_ORDER: readonly BirdType[] = [
  'BROILER',
  'LAYER',
  'BALADI',
  'ROOSTER',
  'TURKEY',
  'OTHER',
];

/** Egg type → line icon + ordered list for the egg-market tile pickers/filters. */
export const EGG_TYPE_ICON: Record<EggType, IconName> = {
  WHITE: 'egg-outline',
  BROWN: 'egg-outline',
  ORGANIC: 'leaf-outline',
  TURKEY: 'egg-outline',
  BALADI: 'egg-outline',
  OTHER: 'help-circle-outline',
};
export const EGG_TYPE_ORDER: readonly EggType[] = [
  'WHITE',
  'BROWN',
  'ORGANIC',
  'TURKEY',
  'BALADI',
  'OTHER',
];

export const SELL_UNIT_ORDER: readonly SellUnit[] = ['TRAY_30', 'CARTON_360', 'PIECE'];

export const PRICING_METHOD_ORDER: readonly PricingMethod[] = ['PER_KG', 'PER_BIRD'];

export const TRADER_TYPE_ORDER: readonly TraderType[] = [
  'WHOLESALE',
  'INDIVIDUAL',
  'EXPORTER',
  'OTHER',
];
