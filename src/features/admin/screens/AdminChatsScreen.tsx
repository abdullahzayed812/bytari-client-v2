import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Skeleton } from '@/components/feedback';
import { Permission } from '@/constants/permissions';
import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AdminListScreen, AdminRow, FilterChips } from '../components';
import { useAdminChats, useAdminOrganizations } from '../hooks';
import type { AdminChatConversation, OrganizationStatus } from '../types';

type Tab = 'conversations' | 'rooms';

function statusTone(s: OrganizationStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'ACTIVE') return 'success';
  if (s === 'PENDING') return 'info';
  if (s === 'SUSPENDED') return 'warning';
  return 'danger';
}

/**
 * `/admin/chats` — the dashboard's "الدردشات" card. Two tabs:
 *  - "المحادثات": read-only oversight of every 1:1 conversation (`chat.read`,
 *    ADMIN-override) — no per-conversation transcript screen yet, just the
 *    count and a scannable list.
 *  - "غرف الدردشة": Global Chat public rooms — a plain `organizations` list
 *    (`type=CHAT_ROOM`), same data/screens `AdminOrganizationsScreen` /
 *    `AdminOrganizationDetailScreen` already use, so create/edit/moderator/
 *    member management is all reused as-is, not duplicated.
 */
export default function AdminChatsScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const caps = useCapabilities();
  const [tab, setTab] = useState<Tab>('conversations');

  const conversationsQ = useAdminChats({ enabled: tab === 'conversations' });
  const roomsQ = useAdminOrganizations({ type: 'CHAT_ROOM', enabled: tab === 'rooms' });

  const canCreateRoom = caps.can(Permission.CHAT_ROOM_ADMIN_CREATE);

  const filterBar = (
    <FilterChips<Tab>
      value={tab}
      onChange={(v) => setTab(v ?? 'conversations')}
      options={[
        { value: 'conversations', label: t('chats.tab.conversations') },
        { value: 'rooms', label: t('chats.tab.rooms') },
      ]}
    />
  );

  if (tab === 'rooms') {
    return (
      <AdminListScreen
        title={t('dashboard.cards.chats.title')}
        right={
          canCreateRoom ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('chatRoom.createTitle')}
              onPress={() => router.push(Routes.adminCreateChatRoom)}
            />
          ) : undefined
        }
        filterBar={filterBar}
        query={roomsQ}
        data={roomsQ.organizations}
        keyExtractor={(o) => o.id}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="50%" height={16} />
            <Skeleton width="35%" height={12} />
          </View>
        }
        emptyIcon="chatbubbles-outline"
        emptyTitle={t('chats.roomsEmpty')}
        emptyMessage={t('chats.roomsEmptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        renderItem={(o) => (
          <AdminRow
            title={o.name}
            subtitle={o.description ?? undefined}
            badge={{ label: t(`orgs.status.${o.status}`), tone: statusTone(o.status) }}
            onPress={() => router.push(Routes.adminOrganization(o.id))}
          />
        )}
      />
    );
  }

  return (
    <AdminListScreen<AdminChatConversation>
      title={t('dashboard.cards.chats.title')}
      filterBar={filterBar}
      query={conversationsQ}
      data={conversationsQ.conversations}
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
          title={t(`chats.type.${c.type}`, { defaultValue: c.type })}
          subtitle={t(`chats.status.${c.status}`, { defaultValue: c.status })}
          meta={formatDate(c.lastMessageAt ?? c.createdAt)}
        />
      )}
    />
  );
}
