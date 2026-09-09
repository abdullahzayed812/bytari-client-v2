/**
 * Veterinary Services marketplace contract. Mirrors
 * `server/src/modules/vet-services` (`vet-service.types.ts` /
 * `vet-service.constants.ts`) and OpenAPI `vetServices` — verified against the
 * real implementation, not assumed.
 *
 * Two moderated entities (LISTINGS by vets, REQUESTS by pet owners), each with
 * the PENDING → APPROVED / REJECTED lifecycle. Two engagement entities (OFFERS
 * a vet submits on a request; LISTING-REQUESTS a pet owner submits on a
 * listing) with PENDING → ACCEPTED → COMPLETED and, once accepted, a
 * PET_OWNER_VETERINARIAN chat (`@/features/chat`).
 */

// --- controlled vocabularies (exact backend values) -----------------

export const VET_SERVICE_ANIMAL_TYPES = [
  'DOG',
  'CAT',
  'BIRD',
  'POULTRY',
  'SHEEP',
  'GOAT',
  'CATTLE',
  'HORSE',
  'CAMEL',
  'FISH',
  'OTHER',
] as const;
export type VetServiceAnimalType = (typeof VET_SERVICE_ANIMAL_TYPES)[number];

export const VET_SERVICE_TYPES = [
  'VACCINATION',
  'EXAMINATION',
  'TREATMENT',
  'SURGERY',
  'ARTIFICIAL_INSEMINATION',
  'FOLLOW_UP',
  'HOME_VISIT',
  'DIAGNOSIS',
  'CONSULTATION',
  'OTHER',
] as const;
export type VetServiceType = (typeof VET_SERVICE_TYPES)[number];

export const VET_SERVICE_LOCATION_MODES = ['CLINIC', 'FIELD_VISIT', 'BOTH'] as const;
export type VetServiceLocationMode = (typeof VET_SERVICE_LOCATION_MODES)[number];

export const VET_SERVICE_PRICE_TYPES = ['FIXED', 'APPROXIMATE', 'NEGOTIABLE'] as const;
export type VetServicePriceType = (typeof VET_SERVICE_PRICE_TYPES)[number];

export const VET_SERVICE_URGENCIES = ['NORMAL', 'URGENT'] as const;
export type VetServiceUrgency = (typeof VET_SERVICE_URGENCIES)[number];

export const MODERATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const ENGAGEMENT_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
] as const;
export type EngagementStatus = (typeof ENGAGEMENT_STATUSES)[number];

// --- shared -----------------------------------------------------

export interface VetServiceUserSummary {
  id: string;
  firstName: string;
  lastName: string;
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

// --- listings -------------------------------------------------

export interface ServiceListing {
  id: string;
  veterinarianUserId: string;
  veterinarian: VetServiceUserSummary;
  title: string;
  description: string;
  serviceType: VetServiceType;
  animalType: VetServiceAnimalType;
  specialty: string | null;
  governorate: string;
  district: string | null;
  priceAmount: string | null;
  priceType: VetServicePriceType;
  locationMode: VetServiceLocationMode;
  availability: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  executionDuration: string | null;
  arrivalTime: string | null;
  details: string[];
  imageUrls: string[];
  status: ModerationStatus;
  rejectionReason: string | null;
  closedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Public browse projection uses `publishedAt`. */
  publishedAt?: string;
}

export interface CreateServiceListingInput {
  title: string;
  description: string;
  serviceType: VetServiceType;
  animalType: VetServiceAnimalType;
  specialty?: string | null;
  governorate: string;
  district?: string | null;
  priceAmount?: string | null;
  priceType?: VetServicePriceType;
  locationMode?: VetServiceLocationMode;
  availability?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  executionDuration?: string | null;
  arrivalTime?: string | null;
  details?: string[];
  imageKeys?: string[];
}

// --- requests -----------------------------------------------

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  petOwnerUserId: string;
  petOwner: VetServiceUserSummary;
  title: string;
  description: string;
  animalType: VetServiceAnimalType;
  serviceType: VetServiceType;
  animalCount: number | null;
  animalAge: string | null;
  governorate: string;
  district: string | null;
  detailedAddress: string | null;
  needsFieldVisit: boolean;
  preferredDate: string | null;
  budgetAmount: string | null;
  urgency: VetServiceUrgency;
  extraNotes: string | null;
  imageUrls: string[];
  status: ModerationStatus;
  rejectionReason: string | null;
  closedAt: string | null;
  offerCount?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface CreateServiceRequestInput {
  title: string;
  description: string;
  animalType: VetServiceAnimalType;
  serviceType: VetServiceType;
  animalCount?: number | null;
  animalAge?: string | null;
  governorate: string;
  district?: string | null;
  detailedAddress?: string | null;
  needsFieldVisit?: boolean;
  preferredDate?: string | null;
  budgetAmount?: string | null;
  urgency?: VetServiceUrgency;
  extraNotes?: string | null;
  imageKeys?: string[];
}

// --- offers (vet → request) --------------------------------

export interface ServiceOffer {
  id: string;
  requestId: string;
  veterinarianUserId: string;
  veterinarian: VetServiceUserSummary;
  proposedAmount: string | null;
  executionDate: string | null;
  expectedDuration: string | null;
  includesFieldVisit: boolean | null;
  details: string | null;
  imageUrls: string[];
  status: EngagementStatus;
  conversationId: string | null;
  decidedAt: string | null;
  createdAt: string;
  request?: {
    id: string;
    requestNumber: string;
    title: string;
    animalType: VetServiceAnimalType;
    serviceType: VetServiceType;
    petOwnerUserId: string;
  };
}

export interface CreateOfferInput {
  proposedAmount?: string | null;
  executionDate?: string | null;
  expectedDuration?: string | null;
  includesFieldVisit?: boolean | null;
  details?: string | null;
  imageKeys?: string[];
}

// --- listing-requests (owner → listing) -------------------

export interface ListingRequest {
  id: string;
  requestNumber: string;
  listingId: string;
  petOwnerUserId: string;
  petOwner: VetServiceUserSummary;
  animalType: VetServiceAnimalType;
  animalCount: number | null;
  animalAge: string | null;
  governorate: string | null;
  district: string | null;
  needsFieldVisit: boolean;
  preferredDatetime: string | null;
  budgetAmount: string | null;
  notes: string | null;
  previousVisit: boolean | null;
  imageUrls: string[];
  status: EngagementStatus;
  conversationId: string | null;
  decidedAt: string | null;
  createdAt: string;
  listing?: {
    id: string;
    title: string;
    serviceType: VetServiceType;
    animalType: VetServiceAnimalType;
    veterinarianUserId: string;
    priceAmount: string | null;
  };
}

export interface CreateListingRequestInput {
  animalType: VetServiceAnimalType;
  animalCount?: number | null;
  animalAge?: string | null;
  governorate?: string | null;
  district?: string | null;
  needsFieldVisit?: boolean;
  preferredDatetime?: string | null;
  budgetAmount?: string | null;
  notes?: string | null;
  previousVisit?: boolean | null;
  imageKeys?: string[];
}

// --- filters --------------------------------------------

export interface ListingBrowseFilter {
  search?: string;
  serviceType?: VetServiceType;
  animalType?: VetServiceAnimalType;
  governorate?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface RequestBrowseFilter {
  search?: string;
  serviceType?: VetServiceType;
  animalType?: VetServiceAnimalType;
  governorate?: string;
  urgency?: VetServiceUrgency;
  sort?: 'recent' | 'oldest';
}

export type MineScope = 'all' | 'mine';
