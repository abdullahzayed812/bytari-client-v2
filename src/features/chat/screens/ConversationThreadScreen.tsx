import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';

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
import { Routes } from '@/constants/routes';
import { useAuth } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { notificationService } from '@/services/notifications';
import { useTheme } from '@/theme';

import { ConversationTitle, MessageBubble, MessageComposer } from '../components';
import {
  useConversation,
  useConversationRealtime,
  useDeleteMessage,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
} from '../hooks';

/**
 * Route `/chat/[conversationId]`. A message thread. Live via the existing
 * realtime transport (`useConversationRealtime`); the POST response + the
 * realtime event both invalidate the same query, so nothing renders twice.
 * The latest counterpart message is marked read on load / on arrival.
 */
export default function ConversationThreadScreen() {
  const theme = useTheme();
  const { t } = useTranslation('chat');
  const toast = useToast();
  const { user } = useAuth();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const id = conversationId ?? '';

  const conversationQ = useConversation(id);
  const msgQ = useMessages(id);
  useConversationRealtime(id);
  const send = useSendMessage(id);
  const markRead = useMarkConversationRead(id);
  const del = useDeleteMessage(id);

  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const lastMarkedRef = useRef<string | null>(null);

  const conversation = conversationQ.data;

  // While this thread is on screen, a foreground push for it is not shown.
  useFocusEffect(
    useCallback(() => {
      if (!id) return undefined;
      notificationService.setActiveConversation(id);
      return () => notificationService.setActiveConversation(null);
    }, [id]),
  );

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
    conversationQ.error instanceof ApiError &&
    (conversationQ.error.status === 404 || conversationQ.error.status === 403);
  if (notFound) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('thread.title')} showBack />
        <EmptyState
          icon="lock-closed-outline"
          title={t('thread.notFoundTitle')}
          message={t('thread.notFoundBody')}
          actionLabel={t('thread.back')}
          onAction={() => router.replace(Routes.chat)}
        />
      </SafeAreaScreen>
    );
  }
  if (conversationQ.isError) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('thread.title')} showBack />
        <ErrorState error={conversationQ.error} onRetry={() => void conversationQ.refetch()} />
      </SafeAreaScreen>
    );
  }

  const onSend = (body: string): void => {
    setSendError(null);
    send.mutate(body, {
      onSuccess: () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50),
      onError: (error) => setSendError(apiErrorMessage(error)),
    });
  };

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('thread.title')}
        showBack
        right={
          conversation ? (
            <ConversationTitle
              conversation={conversation}
              variant="caption"
              color="textSecondary"
              numberOfLines={1}
            />
          ) : undefined
        }
      />

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
              <MessageBubble
                message={item}
                currentUserId={user?.id ?? null}
                onDelete={(mid) => setConfirmDeleteId(mid)}
              />
            )}
            ListEmptyComponent={
              <EmptyState icon="chatbubble-ellipses-outline" title={t('thread.noMessages')} />
            }
            ListFooterComponent={
              msgQ.isFetchingNextPage ? <Loading label={t('list.loadingMore')} /> : null
            }
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

      <ConfirmationDialog
        visible={confirmDeleteId !== null}
        title={t('thread.deleteTitle')}
        message={t('thread.deleteBody')}
        confirmLabel={t('thread.deleteConfirm')}
        cancelLabel={t('common.cancel')}
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
