/**
 * Advertisement contract — mirrors the backend `PublicAdCampaignDTO` exactly
 * (`server/src/modules/advertisements/domain/advertisement.types.ts`). One
 * reusable system: a campaign has a `placement` (the screen it renders in) and
 * a `type` (BANNER = one slide, CAROUSEL = ordered slides). `imageUrl` is
 * server-resolved — the client never builds it.
 */

export const AD_PLACEMENTS = [
  'HOME',
  'PETS',
  'POULTRY_FARMS',
  'CLINICS',
  'VETERINARY_OFFICES',
  'VETERINARY_STORES',
  'PET_OWNER_STORE',
  'CONSULTATIONS',
  'COURSES',
  'SEMINARS',
  'POULTRY_MARKET',
  'EGG_MARKET',
  'EXCHANGE_RATES',
  'TRADER_REGISTRATION',
  'SHEEP_FARMS',
  'CATTLE_FARMS',
] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export type AdType = 'BANNER' | 'CAROUSEL';

export interface AdSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface AdCampaign {
  id: string;
  placement: AdPlacement;
  type: AdType;
  title: string;
  slides: AdSlide[];
}
