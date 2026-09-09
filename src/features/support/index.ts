/**
 * Support feature — Mobile Phase 13. Consultations (any user) & Inquiries
 * (approved vets) against `server/src/modules/consultations` — one thread
 * kernel, two kinds. Thread + messages model (NOT a chat feature): create,
 * list-mine, open, post a message while OPEN, and — for a CONSULTATION /
 * INQUIRY system-supervisor or ADMIN — review, respond, close, block/unblock.
 *
 * No attachments, no title/description/category, no message edit/delete — the
 * backend has none (documented in MOBILE_ARCHITECTURE.md, not mocked).
 */
export {
  makeThreadApi,
  threadApi,
  consultationApi,
  inquiryApi,
  supportMessageApi,
  aiSettingsApi,
  supportKeys,
  type ThreadApi,
} from './api';
export {
  useMyThreads,
  useAdminThreads,
  useThread,
  useThreadMessages,
  useCreateThread,
  useSendMessage,
  useCloseThread,
  useSetSenderBlocked,
  useThreadRealtime,
  useAiSettings,
  useUpdateAiSettings,
} from './hooks';
export {
  ThreadStatusBadge,
  ThreadCard,
  ThreadCardSkeleton,
  MessageBubble,
  MessageComposer,
  AiSettingsCard,
  type ThreadCardProps,
  type MessageBubbleProps,
  type MessageComposerProps,
} from './components';
export {
  ThreadListScreen,
  CreateThreadScreen,
  ThreadDetailScreen,
  AdminThreadListScreen,
} from './screens';
export {
  SUPPORT_KIND_META,
  THREAD_KIND_ORDER,
  THREAD_STATUS_TONE,
  MESSAGE_SOURCE_META,
  kindFromSlug,
  kindSlug,
  threadRoom,
} from './constants';
export {
  buildConsultationSchema,
  buildInquirySchema,
  buildMessageSchema,
  supportErrorMessage,
  type SupportTFn,
} from './validation/schemas';
export * from './types';
