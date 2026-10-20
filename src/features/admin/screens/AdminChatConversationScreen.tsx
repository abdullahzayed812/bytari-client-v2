import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { MessageBubble } from '@/features/chat';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AdminUserLink } from '../components';
import { useAdminChatConversation, useAdminChatMessages } from '../hooks';

/**
 * `/admin/chat-conversation/[conversationId]` — READ-ONLY oversight of any
 * conversation, even one the administrator is not part of
 * (`GET /admin/chat/conversations/:id[/messages]`, `chat.read`, audited
 * server-side). There is no composer: administrators cannot post here, and
 * opening it neither marks anything read nor adds the admin as a participant.
 *
 * Messages are chronological (oldest first); scrolling down loads newer pages.
 * The "personal" side (pet owner / farm member) aligns to the end so the two
 * sides of the conversation stay distinguishable.
 */
export default function AdminChatConversationScreen() {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const detail = useAdminChatConversation(conversationId);
  const msgs = useAdminChatMessages(conversationId);

  const c = detail.data;
  const title = c ? t(`chats.type.${c.type}`, { defaultValue: c.type }) : t('chats.viewer.title');
  const endSideUserId = c?.petOwnerUserId ?? c?.memberUserId ?? null;

  if (detail.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('chats.viewer.title')} showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }
  if (detail.isError || !c) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('chats.viewer.title')} showBack />
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
        </View>
      </SafeAreaScreen>
    );
  }

  const header = (
    <View style={{ rowGap: theme.spacing.sm, paddingBottom: theme.spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.sm,
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surfaceMuted,
        }}
      >
        <Icon name="eye-outline" size="iconMd" color="textSecondary" />
        <Caption style={{ flex: 1 }}>{t('chats.viewer.readOnly')}</Caption>
      </View>
      <View
        style={{
          rowGap: 4,
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Text variant="bodyStrong">{title}</Text>
        <Caption>
          {t(`chats.status.${c.status}`, { defaultValue: c.status })} ·{' '}
          {t('chats.viewer.createdAt', { date: formatDate(c.createdAt) })}
        </Caption>
        {c.organizationName ? (
          <Caption>{t('chats.viewer.organization', { name: c.organizationName })}</Caption>
        ) : null}
        <Caption>{t('chats.viewer.messageCount', { count: msgs.total })}</Caption>
        <Text variant="label" style={{ marginTop: theme.spacing.xs }}>
          {t('chats.viewer.participants')}
        </Text>
        {c.participants.length === 0 ? (
          <Caption>{t('chats.viewer.noParticipants')}</Caption>
        ) : (
          c.participants.map((p) => (
            <View
              key={p.userId}
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
            >
              <Caption>•</Caption>
              <AdminUserLink userId={p.userId} variant="caption" numberOfLines={1} />
              {p.leftAt ? <Caption>{`(${t('chats.viewer.left')})`}</Caption> : null}
            </View>
          ))
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader title={title} showBack />
      <FlatList
        data={msgs.messages}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={{ rowGap: 2 }}>
            {item.type !== 'SYSTEM' ? (
              <View
                style={{
                  alignSelf: item.senderUserId === endSideUserId ? 'flex-end' : 'flex-start',
                }}
              >
                <AdminUserLink userId={item.senderUserId} variant="caption" numberOfLines={1} />
              </View>
            ) : null}
            {/* No `onDelete`: the viewer is read-only. */}
            <MessageBubble message={item} currentUserId={endSideUserId} />
          </View>
        )}
        ListEmptyComponent={
          msgs.isLoading ? (
            <Loading />
          ) : msgs.isError ? (
            <ErrorState error={msgs.error} onRetry={() => void msgs.refetch()} />
          ) : (
            <EmptyState icon="chatbubbles-outline" title={t('chats.viewer.empty')} />
          )
        }
        ListFooterComponent={
          msgs.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (msgs.hasNextPage && !msgs.isFetchingNextPage) void msgs.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={msgs.isRefetching && !msgs.isFetchingNextPage}
            onRefresh={() => {
              void detail.refetch();
              void msgs.refetch();
            }}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={{
          padding: theme.screenPadding,
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.sm,
          flexGrow: 1,
        }}
      />
    </SafeAreaScreen>
  );
}
