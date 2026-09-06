/**
 * Poultry Markets contract — trader registration, poultry/egg classified
 * offers, the two exchange-rate ("bourse") boards, and the governorate
 * statistics summary. Mirrors `server/src/modules/market` EXACTLY. Trader
 * status is a per-USER concept — nothing here carries an `organizationId`.
 */

// --- trader registration -------------------------------------------

export const TRADER_STATUSES = [
  'NOT_REGISTERED',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
] as const;
export type TraderStatus = (typeof TRADER_STATUSES)[number];

export const TRADER_TYPES = ['WHOLESALE', 'INDIVIDUAL', 'EXPORTER', 'OTHER'] as const;
export type TraderType = (typeof TRADER_TYPES)[number];

export interface TraderProfile {
  id: string;
  userId: string;
  displayName: string;
  traderType: TraderType;
  governorate: string;
  district: string | null;
  phone: string;
  whatsapp: string | null;
  bio: string | null;
  status: TraderStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Admin list row — adds the applicant's name/email. */
export interface TraderApplicationSummary extends TraderProfile {
  user: { id: string; email: string; firstName: string; lastName: string };
}

export interface RegisterTraderInput {
  displayName: string;
  traderType: TraderType;
  governorate: string;
  district?: string;
  phone: string;
  whatsapp?: string;
  bio?: string;
  termsAccepted: true;
}

export interface TraderStatusResult {
  traderStatus: TraderStatus;
  profile: TraderProfile | null;
}

// --- poultry offers --------------------------------------------------

export const BIRD_TYPES = ['BALADI', 'LAYER', 'BROILER', 'ROOSTER', 'TURKEY', 'OTHER'] as const;
export type BirdType = (typeof BIRD_TYPES)[number];

export const PRICING_METHODS = ['PER_KG', 'PER_BIRD'] as const;
export type PricingMethod = (typeof PRICING_METHODS)[number];

export const POULTRY_OFFER_STATUSES = ['ACTIVE', 'REMOVED'] as const;
export type PoultryOfferStatus = (typeof POULTRY_OFFER_STATUSES)[number];

export const MAX_POULTRY_OFFER_IMAGES = 5;

export interface PoultryOffer {
  id: string;
  traderUserId: string;
  birdType: BirdType;
  breed: string | null;
  quantity: number;
  pricingMethod: PricingMethod;
  /** Decimal string (backend `numeric`). Never a JS float. */
  price: string;
  ageWeeks: number | null;
  weightKg: string | null;
  governorate: string;
  district: string | null;
  phone: string;
  whatsapp: string | null;
  notes: string | null;
  imageUrls: string[];
  status: PoultryOfferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePoultryOfferInput {
  birdType: BirdType;
  breed?: string;
  quantity: number;
  pricingMethod: PricingMethod;
  price: string;
  ageWeeks?: number;
  weightKg?: string;
  governorate: string;
  district?: string;
  phone: string;
  whatsapp?: string;
  notes?: string;
  galleryKeys?: string[];
}

export interface ListPoultryOffersFilter {
  page: number;
  pageSize: number;
  birdType?: BirdType;
  governorate?: string;
  status?: PoultryOfferStatus;
}

// --- egg offers --------------------------------------------------

export const EGG_TYPES = ['ORGANIC', 'BROWN', 'WHITE', 'OTHER', 'TURKEY', 'BALADI'] as const;
export type EggType = (typeof EGG_TYPES)[number];

export const SELL_UNITS = ['PIECE', 'CARTON_360', 'TRAY_30'] as const;
export type SellUnit = (typeof SELL_UNITS)[number];

export const EGG_OFFER_STATUSES = ['ACTIVE', 'REMOVED'] as const;
export type EggOfferStatus = (typeof EGG_OFFER_STATUSES)[number];

export const MAX_EGG_OFFER_IMAGES = 4;

export interface EggOffer {
  id: string;
  traderUserId: string;
  eggType: EggType;
  sellUnit: SellUnit;
  quantity: number;
  pricePerUnit: string;
  governorate: string;
  district: string | null;
  phone: string;
  whatsapp: string | null;
  notes: string | null;
  imageUrls: string[];
  status: EggOfferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEggOfferInput {
  eggType: EggType;
  sellUnit: SellUnit;
  quantity: number;
  pricePerUnit: string;
  governorate: string;
  district?: string;
  phone: string;
  whatsapp?: string;
  notes?: string;
  galleryKeys?: string[];
}

export interface ListEggOffersFilter {
  page: number;
  pageSize: number;
  eggType?: EggType;
  governorate?: string;
  status?: EggOfferStatus;
}

// --- exchange rates ("bourse") -------------------------------------

export type Trend = 'UP' | 'DOWN' | 'FLAT';

export interface PoultryRateEntry {
  governorate: string;
  meatPricePerKg: string | null;
  layerPricePerBird: string | null;
  meatTrend: Trend | null;
  layerTrend: Trend | null;
}

export interface EggRateEntry {
  governorate: string;
  eggPricePerTray: string | null;
  trend: Trend | null;
}

export interface PoultryRateEntryInput {
  governorate: string;
  meatPricePerKg?: string | null;
  layerPricePerBird?: string | null;
}

export interface EggRateEntryInput {
  governorate: string;
  eggPricePerTray?: string | null;
}

// --- statistics --------------------------------------------------

export interface GovernorateStats {
  governorate: string;
  farmCount: number;
  totalBirds: number;
}

export interface MarketStatisticsSummary {
  totalFarms: number;
  totalBirds: number;
  byGovernorate: GovernorateStats[];
}

// --- shared -----------------------------------------------------

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

export interface UploadUrlResult {
  storageKey: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresInSeconds: number;
}
