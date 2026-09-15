import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Skeleton } from '@/components/feedback';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AdminListScreen, AdminRow } from '../components';
import { useAdminChats } from '../hooks';
import type { AdminChatConversation } from '../types';

/**
 * `/admin/chats` — the dashboard's "الدردشات" card. Read-only oversight list
 * (`chat.read`, ADMIN-override-only) — no per-conversation detail/transcript
 * screen yet, just the count and a scannable list; opening a conversation's
 * full transcript is a future pass.
 */
export default function AdminChatsScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();

  const q = useAdminChats();

  return (
    <AdminListScreen<AdminChatConversation>
      title={t('dashboard.cards.chats.title')}
      query={q}
      data={q.conversations}
      keyExtractor={(c) => c.id}
      skeletonRow={
        <View style={{ rowGap: 8, padding: theme.spacing.md }}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="35%" height={12} />
        </View>
      }
      emptyIcon="chatbubbles-outline"
      emptyTitle={t('chats.empty')}
      loadingMoreLabel={t('common.loadingMore')}
      renderItem={(c) => (
        <AdminRow
          title={t(`chats.type.${c.type}`)}
          subtitle={t(`chats.status.${c.status}`, { defaultValue: c.status })}
          meta={formatDate(c.lastMessageAt ?? c.createdAt)}
        />
      )}
    />
  );
}
