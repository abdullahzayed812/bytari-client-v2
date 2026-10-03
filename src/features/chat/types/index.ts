/**
 * Chat contract — Final Mobile Completion phase. Mirrors
 * `server/src/modules/chat` EXACTLY (`chat.constants.ts`, `chat.types.ts` →
 * `ConversationDTO` / `MessageDTO`, OpenAPI `phase12`).
 *
 * Chat is RELATIONSHIP-scoped, not permission-scoped:
 *   PET_OWNER_CLINIC  — the pet owner ↔ any ACTIVE member of a CLINIC org.
 *   FARM_OWNER_MEMBER — the farm owner ↔ one ACTIVE non-owner member of a FARM.
 * A non-participant on any conversation route gets 404 (never 403).
 *
 * Messages may carry ONE attachment (image / video / file) — uploaded through
 * the presigned flow, served only as a short-lived signed URL.
 *
 * NOT in the backend (documented in MOBILE_ARCHITECTURE.md, never mocked):
 * message edit, typing indicators, and a pet-owner-facing clinic directory to *start* a
 * PET_OWNER_CLINIC conversation (the clinic side initiates; the owner replies).
 */

export const CONVERSATION_TYPES = [
  'PET_OWNER_CLINIC',
  'FARM_OWNER_MEMBER',
  'PET_OWNER_VETERINARIAN',
  'PET_OWNER_VETERINARY_OFFICE',
  /** A Global Chat room the caller has joined (explicit ROOM_MEMBER participant row). */
  'CHAT_ROOM',
  /** Syndicate admin ↔ one registered member (opened from the syndicate's member screen). */
  'SYNDICATE_MEMBER',
  /** Adoption / Mating / Lost listing — the interested user ↔ the listing owner. */
  'ANIMAL_PUBLICATION',
  /** Two members of the same farm (its veterinarian ↔ an employee) — "colleagues" chat. */
  'FARM_MEMBER_DIRECT',
] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const CONVERSATION_SIDES = [
  'PET_OWNER',
  'CLINIC',
  'FARM_OWNER',
  'FARM_MEMBER',
  'VETERINARIAN',
  'VETERINARY_OFFICE',
  'ROOM_MEMBER',
  'SYNDICATE',
  'SYNDICATE_MEMBER',
  'LISTING_OWNER',
] as const;
export type ConversationSide = (typeof CONVERSATION_SIDES)[number];

export const CONVERSATION_STATUSES = ['OPEN', 'COMPLETED', 'CLOSED'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export type ConversationSubjectType =
  | 'VET_SERVICE_OFFER'
  | 'VET_SERVICE_LISTING_REQUEST'
  | 'VET_JOB_APPLICATION'
  | 'ANIMAL_PUBLICATION';

export const MESSAGE_TYPES = ['TEXT', 'SYSTEM'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const MESSAGE_BODY_MAX = 4000;

// --- chat media (mirrors server `CHAT_ATTACHMENT_*`) ----------------------

export const CHAT_ATTACHMENT_KINDS = ['IMAGE', 'VIDEO', 'FILE'] as const;
export type ChatAttachmentKind = (typeof CHAT_ATTACHMENT_KINDS)[number];

/** Per-kind byte ceilings — the server enforces the same values. */
export const CHAT_ATTACHMENT_MAX_BYTES: Record<ChatAttachmentKind, number> = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 50 * 1024 * 1024,
  FILE: 20 * 1024 * 1024,
};

/** Document types the "file" picker offers (server allow-list). */
export const CHAT_FILE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

export function attachmentKindFor(mimeType: string): ChatAttachmentKind {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  return 'FILE';
}

/** A message's attachment as the API returns it — never a storage key. */
export interface ChatMessageAttachment {
  kind: ChatAttachmentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Short-lived signed GET URL (re-fetch via the attachment endpoint when expired). */
  url: string;
  urlExpiresInSeconds: number;
}

/** Reference to an uploaded object, sent with the message. */
export interface OutgoingAttachment {
  kind: ChatAttachmentKind;
  storageKey: string;
  fileName: string;
}

export interface SendMessageInput {
  body?: string;
  attachment?: OutgoingAttachment;
}

/** `GET /conversations/unread-summary` — the dashboard "messages" badge. */
export interface ConversationUnreadSummary {
  unreadConversations: number;
  unreadMessages: number;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  /** `null` for a PET_OWNER_VETERINARIAN marketplace deal. */
  organizationId: string | null;
  /** The individual counterpart on the personal side (pet owner / farm member / vet). */
  counterpartUserId: string | null;
  /** The caller's resolved side for this conversation. */
  viewerSide: ConversationSide;
  /** Pinned vet-service engagement (PET_OWNER_VETERINARIAN only). */
  subjectType: ConversationSubjectType | null;
  subjectId: string | null;
  /** Job lifecycle — always `OPEN` for org conversations. */
  status: ConversationStatus;
  lastMessageAt: string | null;
  /** `null` when read state is not tracked for the caller (the dynamic clinic side). */
  unreadCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  /** `null` for a soft-deleted message; `deletedAt` is then set. */
  body: string | null;
  type: MessageType;
  /** `null` / absent when none or the message is deleted. */
  attachment?: ChatMessageAttachment | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface ConversationListFilter {
  page: number;
  pageSize: number;
  organizationId?: string;
}

export interface StartConversationInput {
  organizationId: string;
  /** Only when the organization side opens it (clinic member → pet owner; farm owner → member). */
  targetUserId?: string;
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
