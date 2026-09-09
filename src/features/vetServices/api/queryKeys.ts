import type {
  EngagementStatus,
  ListingBrowseFilter,
  ModerationStatus,
  RequestBrowseFilter,
} from '../types';

/** One `all` prefix invalidates the whole marketplace after any mutation. */
export const vetServiceKeys = {
  all: ['vet-services'] as const,

  listings: () => [...vetServiceKeys.all, 'listings'] as const,
  listingList: (f: ListingBrowseFilter) => [...vetServiceKeys.listings(), 'browse', f] as const,
  myListingList: (status?: ModerationStatus) =>
    [...vetServiceKeys.listings(), 'mine', { status: status ?? null }] as const,
  listing: (id: string) => [...vetServiceKeys.listings(), 'detail', id] as const,
  myListing: (id: string) => [...vetServiceKeys.listings(), 'manage', id] as const,

  requests: () => [...vetServiceKeys.all, 'requests'] as const,
  requestList: (f: RequestBrowseFilter) => [...vetServiceKeys.requests(), 'browse', f] as const,
  myRequestList: (status?: ModerationStatus) =>
    [...vetServiceKeys.requests(), 'mine', { status: status ?? null }] as const,
  request: (id: string) => [...vetServiceKeys.requests(), 'detail', id] as const,

  offers: () => [...vetServiceKeys.all, 'offers'] as const,
  requestOffers: (requestId: string, status?: EngagementStatus) =>
    [...vetServiceKeys.offers(), 'for-request', requestId, { status: status ?? null }] as const,
  myOffers: (status?: EngagementStatus) =>
    [...vetServiceKeys.offers(), 'mine', { status: status ?? null }] as const,
  offer: (id: string) => [...vetServiceKeys.offers(), 'detail', id] as const,

  listingRequests: () => [...vetServiceKeys.all, 'listing-requests'] as const,
  listingRequestsForListing: (listingId: string, status?: EngagementStatus) =>
    [...vetServiceKeys.listingRequests(), 'for-listing', listingId, { status: status ?? null }] as const,
  receivedListingRequests: (status?: EngagementStatus) =>
    [...vetServiceKeys.listingRequests(), 'received', { status: status ?? null }] as const,
  myListingRequests: (status?: EngagementStatus) =>
    [...vetServiceKeys.listingRequests(), 'mine', { status: status ?? null }] as const,
  listingRequest: (id: string) => [...vetServiceKeys.listingRequests(), 'detail', id] as const,

  // --- moderation (ADMIN / VET_SERVICE supervisor) ---
  adminListingList: (status?: ModerationStatus) =>
    [...vetServiceKeys.listings(), 'admin', { status: status ?? null }] as const,
  adminRequestList: (status?: ModerationStatus) =>
    [...vetServiceKeys.requests(), 'admin', { status: status ?? null }] as const,
};
