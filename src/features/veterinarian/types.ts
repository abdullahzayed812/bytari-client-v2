/**
 * Veterinarian application contract — Mobile Phase 4. Mirrors
 * `server/src/modules/veterinarians/*` exactly.
 *
 *   apply → PENDING → (admin) approve → APPROVED   (+ global VETERINARIAN role)
 *                   → (admin) reject  → REJECTED   (the user may re-apply)
 */
export const VET_APPLICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type VetApplicationStatus = (typeof VET_APPLICATION_STATUSES)[number];

/** Whether the applicant is a practicing vet or a veterinary-medicine student. */
export const VETERINARIAN_SUB_TYPES = ['VETERINARIAN', 'STUDENT'] as const;
export type VeterinarianSubType = (typeof VETERINARIAN_SUB_TYPES)[number];

/**
 * Supporting-document kinds accepted by `/veterinarians/documents/upload-url`
 * and `/veterinarians/apply`. `VETERINARIAN` requires `LICENSE_OR_ID`
 * (`ADDITIONAL_ID` optional); `STUDENT` requires both `STUDENT_ID_FRONT` and
 * `STUDENT_ID_BACK`.
 */
export const VETERINARIAN_DOCUMENT_KINDS = [
  'LICENSE_OR_ID',
  'ADDITIONAL_ID',
  'STUDENT_ID_FRONT',
  'STUDENT_ID_BACK',
] as const;
export type VeterinarianDocumentKind = (typeof VETERINARIAN_DOCUMENT_KINDS)[number];

/** A document as returned by the server (never carries the storage key back). */
export interface VeterinarianApplicationDocument {
  kind: VeterinarianDocumentKind;
  filename: string;
  mimeType: string;
}

export interface VeterinarianApplication {
  id: string;
  userId: string;
  status: VetApplicationStatus;
  note: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
  /** Added alongside the registration flow — the applicant kind. */
  subType?: VeterinarianSubType;
  /** Added alongside the registration flow — submitted document metadata. */
  documents?: VeterinarianApplicationDocument[];
}

/** `GET /veterinarians/me/status`. */
export interface VeterinarianStatusResponse {
  /** The user's `veterinarian_status` — `NOT_APPLIED | PENDING | APPROVED | REJECTED`. */
  veterinarianStatus: string;
  /** The latest application row, or `null` if the user never applied. */
  application: VeterinarianApplication | null;
  /** Added alongside the registration flow. */
  subType?: VeterinarianSubType;
  documents?: VeterinarianApplicationDocument[];
}

/** A document to attach when submitting the application (client → server). */
export interface ApplyDocumentInput {
  kind: VeterinarianDocumentKind;
  storageKey: string;
  filename: string;
  mimeType: string;
}

export interface ApplyForVeterinarianInput {
  note?: string;
  subType: VeterinarianSubType;
  /** Max 2 documents. Server enforces the per-`subType` required set. */
  documents: ApplyDocumentInput[];
}

export interface RequestDocumentUploadUrlInput {
  kind: VeterinarianDocumentKind;
  filename: string;
  mimeType: string;
  size: number;
}
