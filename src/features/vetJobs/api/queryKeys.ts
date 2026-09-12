import type {
  OfferBrowseFilter,
  SeekerBrowseFilter,
  VetJobApplicationStatus,
  VetJobModerationStatus,
} from '../types';

/** One `all` prefix invalidates the whole Jobs feature after any mutation. */
export const vetJobKeys = {
  all: ['vet-jobs'] as const,

  offers: () => [...vetJobKeys.all, 'offers'] as const,
  offerList: (f: OfferBrowseFilter) => [...vetJobKeys.offers(), 'browse', f] as const,
  myOfferList: (status?: VetJobModerationStatus) =>
    [...vetJobKeys.offers(), 'mine', { status: status ?? null }] as const,
  offer: (id: string) => [...vetJobKeys.offers(), 'detail', id] as const,
  myOffer: (id: string) => [...vetJobKeys.offers(), 'manage', id] as const,

  seekers: () => [...vetJobKeys.all, 'seekers'] as const,
  seekerList: (f: SeekerBrowseFilter) => [...vetJobKeys.seekers(), 'browse', f] as const,
  seeker: (id: string) => [...vetJobKeys.seekers(), 'detail', id] as const,
  mySeekerProfile: () => [...vetJobKeys.seekers(), 'mine'] as const,

  applications: () => [...vetJobKeys.all, 'applications'] as const,
  offerApplications: (offerId: string, status?: VetJobApplicationStatus) =>
    [...vetJobKeys.applications(), 'for-offer', offerId, { status: status ?? null }] as const,
  receivedApplications: (status?: VetJobApplicationStatus) =>
    [...vetJobKeys.applications(), 'received', { status: status ?? null }] as const,
  myApplications: (status?: VetJobApplicationStatus) =>
    [...vetJobKeys.applications(), 'mine', { status: status ?? null }] as const,
  application: (id: string) => [...vetJobKeys.applications(), 'detail', id] as const,

  // --- moderation (ADMIN / VET_JOBS supervisor) ---
  adminOfferList: (status?: VetJobModerationStatus) =>
    [...vetJobKeys.offers(), 'admin', { status: status ?? null }] as const,
  adminSeekerList: (status?: VetJobModerationStatus) =>
    [...vetJobKeys.seekers(), 'admin', { status: status ?? null }] as const,
};
