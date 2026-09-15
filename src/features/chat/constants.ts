import type { IconName } from '@/components/content';

import type { Conversation, ConversationSide } from './types';

/** Icon per conversation type. */
export function conversationIcon(type: Conversation['type']): IconName {
  if (type === 'FARM_OWNER_MEMBER') return 'leaf-outline';
  if (type === 'PET_OWNER_VETERINARY_OFFICE') return 'business-outline';
  return 'medkit-outline';
}

/** `true` when the caller is on the organization side and the title is a person's name. */
export function titleIsCounterpart(side: ConversationSide): boolean {
  return side === 'CLINIC' || side === 'FARM_OWNER' || side === 'VETERINARY_OFFICE';
}

/** Realtime room for one conversation (mirrors `server/src/infra/realtime/rooms.ts`). */
export function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}
