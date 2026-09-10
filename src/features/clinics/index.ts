/**
 * Clinics feature (public discovery — "Available clinics", backing the Home
 * section's "View all" link and `/organizations/discover*`).
 *
 * A CLINIC organization's creation / approval / membership / supervisors are
 * the Phase 4 `@/features/organizations` endpoints and screens — this feature
 * only adds the public browse experience: list → profile → follow/review/book.
 * Shared UI primitives (`ImageCarousel`, `RatingStars`, `ReviewModal`,
 * `ClinicCard`, `DiscoverFilterBar`) and the generic discover hooks
 * (`useDiscoverOrganizations`, `usePublicOrganization`, `useFollowOrganization`,
 * `useUnfollowOrganization`) stay in `@/features/organizations` — they're
 * reused by `@/features/veterinaryOffices` too, so moving them here would
 * create a leaf-to-leaf dependency instead of both depending on the shared
 * organizations module.
 */
export { ClinicsScreen, ClinicDetailsScreen } from './screens';
