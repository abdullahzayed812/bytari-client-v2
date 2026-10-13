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

/** Square crop exported at a fixed size — the cards render it in a square tile. */
export const HOME_SECTION_IMAGE_SIZE = { width: 512, height: 512 } as const;
