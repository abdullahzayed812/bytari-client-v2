import { useTranslation } from 'react-i18next';

import { Text, type TextProps } from '@/components/typography';
import { useChatRoom } from '@/features/globalChat/hooks';
import { useOrganization } from '@/features/organizations';
import { UserName } from '@/features/users';

import { titleIsCounterpart } from '../constants';
import type { Conversation } from '../types';

export interface ConversationTitleProps extends Omit<TextProps, 'children'> {
  conversation: Conversation;
}

/**
 * The conversation's display name from the caller's perspective:
 *  - on the organization side (CLINIC / FARM_OWNER) → the counterpart person's name
 *  - on the personal side (PET_OWNER / FARM_MEMBER) → the organization's name
 *
 * Names are resolved through the shared `users` / `organizations` features — no
 * second profile system.
 */
export function ConversationTitle({ conversation, ...textProps }: ConversationTitleProps) {
  const { t } = useTranslation('chat');

  if (conversation.type === 'CHAT_ROOM') {
    return <RoomName organizationId={conversation.organizationId} {...textProps} />;
  }
  // Person ↔ person (listing contact): always the other party's name.
  if (conversation.type === 'ANIMAL_PUBLICATION' || titleIsCounterpart(conversation.viewerSide)) {
    return (
      <UserName
        userId={conversation.counterpartUserId}
        fallback={t('title.unknownPerson')}
        {...textProps}
      />
    );
  }
  return <OrgName organizationId={conversation.organizationId} {...textProps} />;
}

function OrgName({
  organizationId,
  ...textProps
}: { organizationId: string | null } & Omit<TextProps, 'children'>) {
  const { t } = useTranslation('chat');
  const q = useOrganization(organizationId ?? undefined);
  return <Text {...textProps}>{q.data?.name ?? t('title.unknownOrg')}</Text>;
}

/** A joined Global Chat room — its name comes from the room details endpoint (member-readable). */
function RoomName({
  organizationId,
  ...textProps
}: { organizationId: string | null } & Omit<TextProps, 'children'>) {
  const { t } = useTranslation('chat');
  const q = useChatRoom(organizationId ?? undefined);
  return <Text {...textProps}>{q.data?.name ?? t('title.unknownOrg')}</Text>;
}
