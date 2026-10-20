/**
 * The EXISTING bottom section cards of the two home pages. Mirrors the server
 * `HOME_SECTION_KEYS` — the cards' titles, routes and fallback icons stay in
 * the home screens; only the optional admin-managed image comes from here.
 */
export const HOME_SECTION_KEYS = [
  'PET_OWNER_PETS',
  'PET_OWNER_LIVESTOCK',
  'PET_OWNER_POULTRY',
  'VET_CHAT',
  'VET_SERVICES',
  'VET_MAGAZINE',
  'VET_BOOKS',
] as const;
export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

export type HomeSectionPage = 'PET_OWNER_HOME' | 'VETERINARIAN_HOME';

export interface HomeSectionImage {
  key: HomeSectionKey;
  page: HomeSectionPage;
  /** `null` → no image configured; the card keeps its built-in icon. */
  imageUrl: string | null;
  updatedAt: string | null;
}

// --- featured clinics / offices (home carousel) ---------------------

/** `/home-sections/featured-organizations` — one carousel per home page. */
export type FeaturedPlacement = HomeSectionPage;

/** Derived server-side from the switch + window (business date). */
export type FeaturedState = 'DISABLED' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED';

/** Admin row: the entry + its state + the existing organization it points at. */
export interface AdminFeaturedOrganization {
  id: string;
  organizationId: string;
  placement: FeaturedPlacement;
  /** `YYYY-MM-DD` (business date), inclusive. */
  startsOn: string;
  endsOn: string;
  isEnabled: boolean;
  sortOrder: number;
  state: FeaturedState;
  createdAt: string;
  updatedAt: string;
  organization: {
    id: string;
    name: string;
    type: string;
    status: string;
    /** `false` while the organization itself is hidden (not active / subscription expired). */
    publiclyVisible: boolean;
  };
}

export interface CreateFeaturedOrganizationInput {
  organizationId: string;
  placement: FeaturedPlacement;
  startsOn: string;
  endsOn: string;
  isEnabled?: boolean;
  sortOrder?: number;
}

export type UpdateFeaturedOrganizationInput = Partial<
  Pick<CreateFeaturedOrganizationInput, 'startsOn' | 'endsOn' | 'isEnabled' | 'sortOrder'>
>;

/** Square crop exported at a fixed size — the cards render it in a square tile. */
export const HOME_SECTION_IMAGE_SIZE = { width: 512, height: 512 } as const;
