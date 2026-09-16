import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';

import { TextButton } from '@/components/actions';
import { Icon } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  SkeletonText,
  useToast,
} from '@/components/feedback';
import { SafeAreaScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { MessageComposer } from '@/features/chat/components';
import {
  useConversation,
  useConversationRealtime,
  useDeleteMessage,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
} from '@/features/chat/hooks';
import { useOrganization } from '@/features/organizations/hooks';
import { useAuth, useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { RoomMessageBubble } from '../components';
import {
  useChatRoom,
  useChatRoomMembers,
  useDeleteRoomMessage,
  usePinRoomMessage,
  useUnpinRoomMessage,
} from '../hooks';

/** Route `/(app)/global-chat/[organizationId]/thread` — the room's message thread. */
export default function ChatRoomThreadScreen() {
  const theme = useTheme();
  const { t } = useTranslation('globalChat');
  const toast = useToast();
  const { user } = useAuth();
  const caps = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const roomQ = useChatRoom(orgId);
  const org = useOrganization(orgId, { enabled: Boolean(roomQ.data) });
  const conversationId = roomQ.data?.conversationId ?? '';
  const conversationQ = useConversation(conversationId, { enabled: Boolean(conversationId) });
  const msgQ = useMessages(conversationId, { enabled: Boolean(conversationId) });
  useConversationRealtime(conversationId);
  const { nameByUserId } = useChatRoomMembers(orgId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkConversationRead(conversationId);
  const del = useDeleteMessage(conversationId);
  const modDel = useDeleteRoomMessage(orgId, conversationId);
  const pin = usePinRoomMessage(orgId);
  const unpin = useUnpinRoomMessage(orgId);

  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const lastMarkedRef = useRef<string | null>(null);

  const myRole = org.data?.myRole;
  const canModerate = caps.isAdmin || myRole === 'OWNER' || myRole === 'SUPERVISOR';

  // Mark the newest counterpart message read (once per id).
  useEffect(() => {
    const newest = msgQ.messages[msgQ.messages.length - 1];
    if (
      newest &&
      newest.senderUserId !== user?.id &&
      newest.id !== lastMarkedRef.current &&
      !markRead.isPending
    ) {
      lastMarkedRef.current = newest.id;
      markRead.mutate(newest.id);
    }
  }, [msgQ.messages, user?.id, markRead]);

  const notFound =
    (roomQ.error instanceof ApiError && (roomQ.error.status === 404 || roomQ.error.status === 403)) ||
    (conversationQ.error instanceof ApiError &&
      (conversationQ.error.status === 404 || conversationQ.error.status === 403));
  if (notFound) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('thread.title')} showBack />
        <EmptyState
          icon="lock-closed-outline"
          title={t('thread.notFoundTitle')}
          message={t('thread.notFoundBody')}
          actionLabel={t('details.back')}
          onAction={() => router.replace(Routes.globalChat)}
        />
      </SafeAreaScreen>
    );
  }
  if (roomQ.isLoading || !roomQ.data) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('thread.title')} showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }
  if (roomQ.isError) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('thread.title')} showBack />
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={roomQ.error} onRetry={() => void roomQ.refetch()} />
        </View>
      </SafeAreaScreen>
    );
  }

  const room = roomQ.data;
  const menuMessage = msgQ.messages.find((m) => m.id === menuMessageId) ?? null;
  const menuIsPinned = menuMessage != null && room.pinnedMessage?.id === menuMessage.id;

  const onSend = (body: string): void => {
    setSendError(null);
    send.mutate(body, {
      onSuccess: () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50),
      onError: (error) => setSendError(apiErrorMessage(error)),
    });
  };

  const closeMenu = (): void => setMenuMessageId(null);

  return (
    <SafeAreaScreen>
      <AppHeader
        title={room.name}
        showBack
        right={
          <TextButton
            label={t('thread.roomInfo')}
            onPress={() => router.push(Routes.globalChatRoom(room.id))}
          />
        }
      />

      {room.pinnedMessage ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: theme.spacing.sm,
            marginHorizontal: theme.screenPadding,
            marginTop: theme.spacing.sm,
            padding: theme.spacing.sm,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.warningSoft,
          }}
        >
          <Icon name="pin-outline" size="iconSm" color="warning" />
          <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
            {room.pinnedMessage.body}
          </Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={theme.sizes.headerHeight}
      >
        {msgQ.isLoading ? (
          <Section spacing="xl">
            <SkeletonText lines={6} />
          </Section>
        ) : msgQ.isError ? (
          <View style={{ padding: theme.screenPadding }}>
            <ErrorState error={msgQ.error} onRetry={() => void msgQ.refetch()} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={msgQ.messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <RoomMessageBubble
                message={item}
                currentUserId={user?.id ?? null}
                senderName={nameByUserId.get(item.senderUserId)}
                onDelete={(mid) => setConfirmDeleteId(mid)}
                onOpenMenu={(mid) => setMenuMessageId(mid)}
              />
            )}
            ListEmptyComponent={<EmptyState icon="chatbubble-ellipses-outline" title={t('thread.noMessages')} />}
            ListFooterComponent={msgQ.isFetchingNextPage ? <Loading label={t('thread.loadingMore')} /> : null}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            contentContainerStyle={{
              padding: theme.screenPadding,
              rowGap: theme.spacing.md,
              flexGrow: 1,
            }}
            onEndReachedThreshold={0.3}
            onEndReached={() => {
              if (msgQ.hasNextPage && !msgQ.isFetchingNextPage) void msgQ.fetchNextPage();
            }}
          />
        )}

        <MessageComposer sending={send.isPending} error={sendError} onSend={onSend} />
      </KeyboardAvoidingView>

      <BottomSheet visible={menuMessageId != null} onClose={closeMenu} title={t('thread.messageMenuTitle')}>
        <View style={{ rowGap: theme.spacing.sm }}>
          <TextButton
            label={t('thread.reportMessage')}
            icon="flag-outline"
            tone="danger"
            onPress={() => {
              const mid = menuMessageId;
              closeMenu();
              if (mid)
                router.push({
                  pathname: Routes.globalChatReport,
                  params: { targetType: 'MESSAGE', targetId: mid },
                });
            }}
          />
          {canModerate ? (
            <TextButton
              label={menuIsPinned ? t('thread.unpinMessage') : t('thread.pinMessage')}
              icon="pin-outline"
              onPress={() => {
                const mid = menuMessageId;
                closeMenu();
                if (!mid) return;
                if (menuIsPinned) {
                  unpin.mutate(undefined, {
                    onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                  });
                } else {
                  pin.mutate(mid, {
                    onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                  });
                }
              }}
            />
          ) : null}
          {canModerate ? (
            <TextButton
              label={t('thread.deleteMessage')}
              icon="trash-outline"
              tone="danger"
              onPress={() => {
                const mid = menuMessageId;
                closeMenu();
                if (mid)
                  modDel.mutate(mid, {
                    onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                  });
              }}
            />
          ) : null}
        </View>
      </BottomSheet>

      <ConfirmationDialog
        visible={confirmDeleteId !== null}
        title={t('thread.deleteTitle')}
        message={t('thread.deleteBody')}
        confirmLabel={t('thread.deleteConfirm')}
        cancelLabel={t('common.cancel', { defaultValue: 'إلغاء' })}
        destructive
        loading={del.isPending}
        onConfirm={() => {
          const mid = confirmDeleteId;
          setConfirmDeleteId(null);
          if (mid)
            del.mutate(mid, {
              onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
            });
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </SafeAreaScreen>
  );
}
