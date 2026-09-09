/**
 * Veterinary Services marketplace ("الخدمات") — Pet Owner ↔ Veterinarian.
 *
 * Two moderated entities (LISTINGS published by vets, REQUESTS published by pet
 * owners), each PENDING → APPROVED / REJECTED before it is public. Two
 * engagement entities (OFFERS a vet submits on a request; LISTING-REQUESTS a
 * pet owner submits on a listing) with PENDING → ACCEPTED → COMPLETED, plus a
 * PET_OWNER_VETERINARIAN chat (reuses `@/features/chat`) that can be opened
 * immediately and finished ("إنهاء الطلب") once an engagement is accepted.
 *
 * Backend enforces every role / ownership / moderation rule
 * (`server/src/modules/vet-services`). Terms & Conditions are UI-only
 * (`data/vetServicesTerms.ts` + `TermsAcceptField`) — nothing persisted.
 */
export {
  vetServicesApi,
  adminVetServicesApi,
  vetServiceKeys,
  type VetServicesApi,
  type AdminVetServicesApi,
} from './api';
export * from './hooks';
export * from './components';
export {
  IRAQ_GOVERNORATES,
  MODERATION_STATUS_TONE,
  ENGAGEMENT_STATUS_TONE,
  URGENCY_TONE,
  ANIMAL_TYPE_ICON,
  SERVICE_TYPE_ICON,
  formatVetServiceDate,
  formatPrice,
} from './constants';
export { VET_SERVICE_TERMS, type VetServiceTermsKey, type VetServiceTermsDoc } from './data/vetServicesTerms';
export {
  VetServicesHubScreen,
  ServiceListingsBrowseScreen,
  ServiceListingDetailScreen,
  AddServiceListingScreen,
  RequestServiceScreen,
  ServiceRequestsBrowseScreen,
  AddServiceRequestScreen,
  ServiceRequestDetailScreen,
  SubmitOfferScreen,
  MyServicesScreen,
  DealConversationScreen,
  EngagementDetailScreen,
} from './screens';
export * from './types';
