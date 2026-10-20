import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Skeleton } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Permission } from '@/constants/permissions';
import { Routes } from '@/constants/routes';
import { useCapabilities, useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AdminListScreen, AdminRow, FilterChips } from '../components';
import { useAdminChats, useAdminOrganizations } from '../hooks';
import type {
  AdminChatConversation,
  AdminChatConversationStatus,
  AdminChatConversationType,
  OrganizationStatus,
} from '../types';

type Tab = 'conversations' | 'rooms';

const CONVERSATION_TYPES: AdminChatConversationType[] = [
  'PET_OWNER_CLINIC',
  'PET_OWNER_VETERINARY_OFFICE',
  'PET_OWNER_VETERINARIAN',
  'FARM_OWNER_MEMBER',
  'FARM_MEMBER_DIRECT',
  'SYNDICATE_MEMBER',
  'ANIMAL_PUBLICATION',
  'CHAT_ROOM',
];

function conversationStatusTone(s: string): 'success' | 'neutral' | 'danger' {
  if (s === 'OPEN') return 'success';
  if (s === 'CLOSED') return 'danger';
  return 'neutral';
}

/** Participant names for a list row ("أحمد علي، سارة محمد"). */
function peopleLabel(c: AdminChatConversation): string {
  return (c.people ?? [])
    .map((p) => `${p.firstName} ${p.lastName}`.trim())
    .filter(Boolean)
    .join('، ');
}

function statusTone(s: OrganizationStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'ACTIVE') return 'success';
  if (s === 'PENDING') return 'info';
  if (s === 'SUSPENDED') return 'warning';
  return 'danger';
}

/**
 * `/admin/chats` — the dashboard's "الدردشات" card. Two tabs:
 *  - "المحادثات": read-only oversight of every 1:1 conversation (`chat.read`,
 *    ADMIN-override) — searchable by conversation (organization / room) name
 *    or participant name, filterable by type and status (all server-side);
 *    a row opens the read-only transcript viewer (`AdminChatConversationScreen`).
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
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch, 300);
  const [type, setType] = useState<AdminChatConversationType | undefined>();
  const [status, setStatus] = useState<AdminChatConversationStatus | undefined>();

  const conversationsQ = useAdminChats({
    enabled: tab === 'conversations',
    search,
    type,
    status,
  });
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
            // The room's own image (set on create / edit), else the chat icon.
            image={{ uri: o.logoUrl ?? null, fallbackIcon: 'chatbubbles-outline' }}
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
      filterBar={
        <>
          {filterBar}
          <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
            <SearchInput
              value={rawSearch}
              onChangeText={setRawSearch}
              onClear={() => setRawSearch('')}
              placeholder={t('chats.searchPlaceholder')}
              accessibilityLabel={t('chats.searchPlaceholder')}
            />
          </View>
          <FilterChips<AdminChatConversationType>
            value={type}
            onChange={setType}
            options={[
              { value: undefined, label: t('chats.filter.allTypes') },
              ...CONVERSATION_TYPES.map((v) => ({ value: v, label: t(`chats.type.${v}`) })),
            ]}
          />
          <FilterChips<AdminChatConversationStatus>
            value={status}
            onChange={setStatus}
            options={[
              { value: undefined, label: t('chats.filter.allStatuses') },
              { value: 'OPEN', label: t('chats.status.OPEN') },
              { value: 'COMPLETED', label: t('chats.status.COMPLETED') },
              { value: 'CLOSED', label: t('chats.status.CLOSED') },
            ]}
          />
        </>
      }
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
      emptyTitle={search || type || status ? t('chats.noResults') : t('chats.empty')}
      loadingMoreLabel={t('common.loadingMore')}
      renderItem={(c) => {
        const typeLabel = t(`chats.type.${c.type}`, { defaultValue: c.type });
        const people = peopleLabel(c);
        // Name = the organization / room; else the people in it; else the type.
        const title = c.organizationName ?? (people || typeLabel);
        const subtitle = [
          typeLabel,
          c.organizationName ? people : '',
          c.type === 'CHAT_ROOM' && c.participantCount
            ? t('chats.participantCount', { count: c.participantCount })
            : '',
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <AdminRow
            title={title}
            subtitle={subtitle}
            meta={formatDate(c.lastMessageAt ?? c.createdAt)}
            badge={{
              label: t(`chats.status.${c.status}`, { defaultValue: c.status }),
              tone: conversationStatusTone(c.status),
            }}
            image={{ uri: null, fallbackIcon: 'chatbubbles-outline' }}
            onPress={() => router.push(Routes.adminChatConversation(c.id))}
          />
        );
      }}
    />
  );
}
