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
 * NOT in the backend (documented in MOBILE_ARCHITECTURE.md, never mocked):
 * message attachments / media (composer is text-only), message edit, group
 * chat, typing indicators, and a pet-owner-facing clinic directory to *start* a
 * PET_OWNER_CLINIC conversation (the clinic side initiates; the owner replies).
 */

export const CONVERSATION_TYPES = [
  'PET_OWNER_CLINIC',
  'FARM_OWNER_MEMBER',
  'PET_OWNER_VETERINARIAN',
] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const CONVERSATION_SIDES = [
  'PET_OWNER',
  'CLINIC',
  'FARM_OWNER',
  'FARM_MEMBER',
  'VETERINARIAN',
] as const;
export type ConversationSide = (typeof CONVERSATION_SIDES)[number];

export const CONVERSATION_STATUSES = ['OPEN', 'COMPLETED', 'CLOSED'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export type ConversationSubjectType = 'VET_SERVICE_OFFER' | 'VET_SERVICE_LISTING_REQUEST';

export const MESSAGE_TYPES = ['TEXT', 'SYSTEM'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const MESSAGE_BODY_MAX = 4000;

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
