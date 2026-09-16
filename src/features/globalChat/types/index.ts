/**
 * Global Chat contract — mirrors `server/src/modules/chat-rooms/domain/chat-room.types.ts`
 * and `server/src/modules/reports/domain/report.types.ts` EXACTLY. A room is a
 * platform `organizations` row (`type = 'CHAT_ROOM'`); its discussion is an
 * ordinary `conversations` row reusing the existing `@/features/chat` message
 * endpoints as-is (`GET/POST /conversations/:id/messages`, `POST
 * /conversations/:id/read`, `DELETE /messages/:messageId`) — this feature
 * only wraps `/chat-rooms/*` (browse/join/leave/mute/moderate) + `/reports`.
 */

export interface ChatRoomSummary {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  memberCount: number;
  unreadCount: number;
  isJoined: boolean;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'DEACTIVATED';
  createdAt: string;
}

export interface PinnedRoomMessage {
  id: string;
  body: string | null;
  senderUserId: string;
  createdAt: string;
}

export interface ChatRoomDetail extends ChatRoomSummary {
  rules: string | null;
  conversationId: string;
  joinedAt: string | null;
  notificationsMuted: boolean;
  pinnedMessage: PinnedRoomMessage | null;
}

export interface ListChatRoomsFilter {
  page: number;
  pageSize: number;
  search?: string;
}

/** Lean member roster — `GET /chat-rooms/:organizationId/members` (any active member). */
export interface ChatRoomMember {
  userId: string;
  firstName: string;
  lastName: string;
  roleKey: string;
}

export interface CreateChatRoomInput {
  name: string;
  description?: string | null;
  rules?: string | null;
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

// --- content reporting ("الإبلاغ عن الرسالة") -------------------------

export const REPORT_TARGET_TYPES = ['MESSAGE', 'ROOM'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_REASONS = [
  'INAPPROPRIATE_CONTENT',
  'MISLEADING_INFO',
  'HARASSMENT',
  'SPAM',
  'RULES_VIOLATION',
  'OTHER',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export interface SubmitReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string | null;
}

export interface ContentReport {
  id: string;
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED';
  createdAt: string;
}
