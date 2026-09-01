/**
 * Animal-publication contract — Mobile Phase 8 (Lost / Adoption / Mating).
 * Mirrors `server/src/modules/animals` publication code exactly
 * (`publication.constants.ts`, `publication.types.ts`, `publication.schemas.ts`,
 * OpenAPI `phase7`). No invented fields.
 *
 * One reusable model + lifecycle for all three kinds:
 *   owner  → POST /animals/:animalId/publications         (starts PENDING)
 *   owner  → GET  /animals/:animalId/publications[/:id]    (every status)
 *   anyone → GET  /animal-publications[/:id]               (APPROVED only, no owner PII)
 *
 * The create body is ONLY `{ kind, note? }`. There is no location / date-lost /
 * image / description / age / gender input, no edit / delete / close / "mark
 * found" endpoint, and no cross-animal "my listings" endpoint — see
 * MOBILE_ARCHITECTURE.md for the documented backend limitations.
 */

export const PUBLICATION_KINDS = ['LOST', 'ADOPTION', 'MATING'] as const;
export type PublicationKind = (typeof PUBLICATION_KINDS)[number];

export const PUBLICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

/** The small, non-PII animal summary the backend joins onto a publication. */
export interface PublicationAnimal {
  id: string;
  name: string;
  /** Free-form from the backend; usually a Phase 3 species value. */
  species: string;
  breed: string | null;
}

/**
 * Owner / moderation view — `GET /animals/:animalId/publications[/:id]` and the
 * `POST` response. Carries the status + rejection reason the public view omits.
 */
export interface AnimalPublication {
  id: string;
  animalId: string;
  kind: PublicationKind;
  status: PublicationStatus;
  note: string | null;
  createdByUserId: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public-browse projection — `GET /animal-publications[/:id]`. APPROVED only.
 * Deliberately omits the publisher's identity, all moderation metadata, and
 * status. There is **no contact field** — the backend exposes no phone / chat.
 */
export interface PublicPublication {
  id: string;
  kind: PublicationKind;
  note: string | null;
  publishedAt: string;
  animal: PublicationAnimal;
}

// --- request payload (client sends ONLY these fields) --------------
export interface CreatePublicationInput {
  kind: PublicationKind;
  note?: string | null;
}

// --- list ---------------------------------------------------------
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
