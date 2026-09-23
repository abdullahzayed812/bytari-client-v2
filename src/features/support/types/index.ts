/**
 * Consultations & Inquiries contract — Mobile Phase 13. Mirrors
 * `server/src/modules/consultations` EXACTLY (`thread.constants.ts`,
 * `thread.types.ts`, `thread.schemas.ts`, OpenAPI `phase13`) — one thread
 * kernel, two kinds.
 *
 *   Consultation — any authenticated user; optional `animalId` (must be an
 *     animal the caller currently owns).
 *   Inquiry — an APPROVED veterinarian only; never has an animal.
 *
 * Access: CREATOR = `createdByUserId`; RESPONDER = ADMIN, or an ACTIVE
 * CONSULTATION / INQUIRY **system-supervisor** domain assignment who is an
 * approved vet. No relationship → 404. Every mutation is backend-authorised.
 *
 * Image attachments: CONSULTATION / INQUIRY only, and only on the thread's
 * FIRST message — the client presigns each photo against
 * `POST /<slug>/attachments/upload-url`, uploads it straight to R2, then sends
 * the returned storage keys as `imageKeys` on create. SUPPORT has no
 * attachment capability (`maxAttachmentImages: 0`); follow-up messages are
 * body-only for every kind.
 *
 * NOT in the backend (documented in MOBILE_ARCHITECTURE.md, never mocked):
 * title / description / category fields, attachments on FOLLOW-UP messages,
 * message edit/delete by the user, search / category filters, admin
 * status-change or supervisor reassignment endpoints, reopening a CLOSED
 * thread.
 *
 * A thread is OPEN and freely writable by the creator by default. Only a
 * responder CLOSING it, or manually muting the creator (`POST /:id/block`),
 * stops them. CONSULTATION / INQUIRY may get one automatic AI reply on
 * creation (admin-toggled); SUPPORT never does.
 */

export const THREAD_KINDS = ['CONSULTATION', 'INQUIRY', 'SUPPORT'] as const;
export type ThreadKind = (typeof THREAD_KINDS)[number];

export const THREAD_STATUSES = ['OPEN', 'CLOSED'] as const;
export type ThreadStatus = (typeof THREAD_STATUSES)[number];

/** Who a message came from. `senderUserId` is `null` for AI / SYSTEM. */
export const MESSAGE_SOURCES = ['USER', 'SUPERVISOR', 'ADMIN', 'AI', 'SYSTEM'] as const;
export type MessageSource = (typeof MESSAGE_SOURCES)[number];

/** Backend `MAX_MESSAGE_IMAGES` — the per-thread cap on first-message photos. */
export const MAX_THREAD_IMAGES = 6;

export const THREAD_KIND_SLUGS = ['consultations', 'inquiries', 'support-messages'] as const;
export type ThreadKindSlug = (typeof THREAD_KIND_SLUGS)[number];

export interface Thread {
  id: string;
  kind: ThreadKind;
  status: ThreadStatus;
  createdByUserId: string;
  /** Consultations only; always `null` for inquiries. */
  animalId: string | null;
  /** A responder has muted the creator (the thread stays OPEN). */
  senderBlocked: boolean;
  aiResponded: boolean;
  /** ISO datetime or `null`. */
  lastMessageAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  /** `null` for AI / SYSTEM messages. */
  senderUserId: string | null;
  source: MessageSource;
  /** `null` for a soft-deleted message. */
  body: string | null;
  /**
   * Resolved attachment URLs (public CDN or short-lived signed R2 GET) — the
   * raw storage key never leaves the server. `[]` for messages with no photos
   * and for every SUPPORT message.
   */
  imageUrls: string[];
  deletedAt: string | null;
  createdAt: string;
}

// --- request payloads (client sends ONLY these fields) --------------

export interface CreateConsultationInput {
  body: string;
  animalId?: string | null;
  /** Storage keys from `POST /consultations/attachments/upload-url`. Max {@link MAX_THREAD_IMAGES}. */
  imageKeys?: string[];
}
export interface CreateInquiryInput {
  body: string;
  /** Storage keys from `POST /inquiries/attachments/upload-url`. Max {@link MAX_THREAD_IMAGES}. */
  imageKeys?: string[];
}
/** "تواصل معنا" — a support message to the administration. Body only. */
export interface CreateSupportInput {
  body: string;
}
export interface SendMessageInput {
  body: string;
}

export interface ThreadListFilter {
  page: number;
  pageSize: number;
  status?: ThreadStatus;
}
export interface AdminThreadListFilter extends ThreadListFilter {
  /** Filter by creator (admin / supervisor list only). */
  createdBy?: string;
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

// --- AI settings (admin only — `/admin/ai-settings`) ---------------
export interface AiSettings {
  consultationAiEnabled: boolean;
  inquiryAiEnabled: boolean;
}
export interface UpdateAiSettingsInput {
  consultationAiEnabled?: boolean;
  inquiryAiEnabled?: boolean;
}
