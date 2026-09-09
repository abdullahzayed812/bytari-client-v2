import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
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
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import {
  MessageBubble,
  MessageComposer,
  useConversation,
  useConversationRealtime,
  useCloseConversation,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
} from '@/features/chat';
import { useAuth } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { EngagementStatusBadge } from '../components';
import { useListingRequestAction, useOfferAction } from '../hooks';

/** Route `/(app)/vet-services/deals/[conversationId]` — Pet Owner ↔ Vet deal chat. */
export default function DealConversationScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetServices');
  const { t: tc } = useTranslation('chat');
  const toast = useToast();
  const { user } = useAuth();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const id = conversationId ?? '';

  const conversationQ = useConversation(id);
  const msgQ = useMessages(id);
  useConversationRealtime(id);
  const send = useSendMessage(id);
  const markRead = useMarkConversationRead(id);
  const closeConversation = useCloseConversation(id);
  const offerAction = useOfferAction();
  const lrAction = useListingRequestAction();

  const [sendError, setSendError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | 'complete' | 'close'>(null);
  const listRef = useRef<FlatList>(null);
  const lastMarkedRef = useRef<string | null>(null);

  const conversation = conversationQ.data;

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
        <AppHeader title={t('deal.title')} showBack />
        <EmptyState
          icon="lock-closed-outline"
          title={tc('thread.notFoundTitle')}
          message={tc('thread.notFoundBody')}
          actionLabel={tc('thread.back')}
          onAction={() => router.back()}
        />
      </SafeAreaScreen>
    );
  }
  if (conversationQ.isError) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('deal.title')} showBack />
        <ErrorState error={conversationQ.error} onRetry={() => void conversationQ.refetch()} />
      </SafeAreaScreen>
    );
  }

  const engagementKind: 'offer' | 'listing-request' | null =
    conversation?.subjectType === 'VET_SERVICE_OFFER'
      ? 'offer'
      : conversation?.subjectType === 'VET_SERVICE_LISTING_REQUEST'
        ? 'listing-request'
        : null;
  const status = conversation?.status ?? 'OPEN';
  const canComplete = status === 'OPEN' && engagementKind !== null && Boolean(conversation?.subjectId);
  const busy = offerAction.isPending || lrAction.isPending || closeConversation.isPending;

  const onSend = (body: string): void => {
    setSendError(null);
    send.mutate(body, {
      onSuccess: () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50),
      onError: (error) => setSendError(apiErrorMessage(error)),
    });
  };

  const doComplete = () => {
    if (!conversation?.subjectId || !engagementKind) return;
    const opts = {
      onSuccess: () => toast.show({ tone: 'success', message: t('deal.completeDone') }),
      onError: (error: unknown) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    };
    if (engagementKind === 'offer') {
      offerAction.mutate({ id: conversation.subjectId, action: 'complete' }, opts);
    } else {
      lrAction.mutate({ id: conversation.subjectId, action: 'complete' }, opts);
    }
  };

  const doClose = () => {
    closeConversation.mutate(undefined, {
      onSuccess: () => toast.show({ tone: 'success', message: t('deal.closeDone') }),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('deal.title')} showBack />

      {conversation ? (
        <Pressable
          accessibilityRole="button"
          disabled={!engagementKind || !conversation.subjectId}
          onPress={() =>
            engagementKind &&
            conversation.subjectId &&
            router.push(Routes.vetServiceEngagement(engagementKind, conversation.subjectId))
          }
          style={{
            marginHorizontal: theme.screenPadding,
            marginTop: theme.spacing.sm,
            padding: theme.spacing.md,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.serviceSurface,
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: theme.spacing.sm,
          }}
        >
          <Icon name="briefcase-outline" size="iconMd" color="serviceAccent" />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {engagementKind === 'offer'
                ? t('deal.subjectOffer')
                : engagementKind === 'listing-request'
                  ? t('deal.subjectListingRequest')
                  : t('deal.subjectNone')}
            </Text>
            <Caption color="textSecondary">{t('deal.viewEngagement')}</Caption>
          </View>
          <EngagementStatusBadge status={status === 'OPEN' ? 'ACCEPTED' : 'COMPLETED'} />
        </Pressable>
      ) : null}

      {canComplete || status === 'OPEN' ? (
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing.sm,
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.sm,
          }}
        >
          {canComplete ? (
            <View style={{ flex: 1 }}>
              <Button
                label={t('deal.complete')}
                variant="primary"
                size="sm"
                fullWidth
                leftIcon="checkmark-done-outline"
                disabled={busy}
                onPress={() => setConfirm('complete')}
              />
            </View>
          ) : null}
          {status === 'OPEN' ? (
            <View style={{ flex: 1 }}>
              <Button
                label={t('deal.close')}
                variant="outline"
                size="sm"
                fullWidth
                leftIcon="lock-closed-outline"
                disabled={busy}
                onPress={() => setConfirm('close')}
              />
            </View>
          ) : null}
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
              <MessageBubble message={item} currentUserId={user?.id ?? null} />
            )}
            ListEmptyComponent={
              <EmptyState icon="chatbubble-ellipses-outline" title={tc('thread.noMessages')} />
            }
            ListFooterComponent={
              msgQ.isFetchingNextPage ? <Loading label={tc('list.loadingMore')} /> : null
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

        {status === 'OPEN' ? (
          <MessageComposer sending={send.isPending} error={sendError} onSend={onSend} />
        ) : (
          <View style={{ padding: theme.screenPadding }}>
            <Caption center color="textMuted">
              {status === 'COMPLETED' ? t('deal.completedNote') : t('deal.closedNote')}
            </Caption>
          </View>
        )}
      </KeyboardAvoidingView>

      <ConfirmationDialog
        visible={confirm !== null}
        title={t(`deal.confirm.${confirm ?? 'complete'}.title`)}
        message={t(`deal.confirm.${confirm ?? 'complete'}.body`)}
        confirmLabel={t(`deal.${confirm ?? 'complete'}`)}
        cancelLabel={tc('common.cancel')}
        destructive={confirm === 'close'}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const which = confirm;
          setConfirm(null);
          if (which === 'complete') doComplete();
          else if (which === 'close') doClose();
        }}
      />
    </SafeAreaScreen>
  );
}
