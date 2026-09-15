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
  'VETERINARIAN_STORE',
  'CONSULTATIONS',
  'COURSES',
  'SEMINARS',
  'POULTRY_MARKET',
  'EGG_MARKET',
  'EXCHANGE_RATES',
  'TRADER_REGISTRATION',
  'SHEEP_FARMS',
  'CATTLE_FARMS',
  'VETERINARIAN_HOME',
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

// --- admin / supervisor management (`/admin/ads*`) -----------------------
// Same underlying campaign/slide shape as the public feed, plus lifecycle
// fields the admin UI needs (isActive / sortOrder / scheduling window).

export interface AdminAdCampaign {
  id: string;
  placement: AdPlacement;
  type: AdType;
  title: string;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  slides: AdSlide[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdCampaignInput {
  placement: AdPlacement;
  type: AdType;
  title: string;
  sortOrder?: number;
}

export interface UpdateAdCampaignInput {
  title?: string;
  sortOrder?: number;
}

export interface AdSlideContentInput {
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  sortOrder?: number;
}

export interface ListAdminAdCampaignsParams {
  placement?: AdPlacement;
  type?: AdType;
  includeDeleted?: boolean;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}
