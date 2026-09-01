import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
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
import { Row, Section, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useAuth, useCapabilities } from '@/hooks';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { MessageBubble, MessageComposer, ThreadStatusBadge } from '../components';
import { SUPPORT_KIND_META, kindFromSlug } from '../constants';
import {
  useCloseThread,
  useSendMessage,
  useSetSenderBlocked,
  useThread,
  useThreadMessages,
  useThreadRealtime,
} from '../hooks';
import { supportErrorMessage } from '../validation/schemas';

/**
 * Route `/support/[kind]/[threadId]`. A message thread — creator ↔ responder.
 * Live via the existing realtime transport (`useThreadRealtime`); post-send
 * invalidation is the fallback. Responder (supervisor / admin) actions
 * (Close / Block sender) show only when the caller has the backend permission,
 * and the backend re-checks every call.
 */
export default function ThreadDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('support');
  const toast = useToast();
  const { user } = useAuth();
  const caps = useCapabilities();
  const { kind: slug, threadId } = useLocalSearchParams<{ kind: string; threadId: string }>();
  const kind = kindFromSlug(slug) ?? 'CONSULTATION';
  const meta = SUPPORT_KIND_META[kind];
  const id = threadId ?? '';

  const canRespond = caps.isAdmin || caps.can(meta.respondPerm);
  const canClose = caps.isAdmin || caps.can(meta.closePerm);

  // The relationship-scoped route serves creator AND responder (supervisor /
  // admin) — a non-participant gets 404. No need for the `/admin/<slug>/:id`
  // variant here.
  const threadQ = useThread(kind, id);
  const msgQ = useThreadMessages(kind, id);
  useThreadRealtime(kind, id, { enabled: Boolean(id) });

  const send = useSendMessage(kind, id);
  const close = useCloseThread(kind, id);
  const block = useSetSenderBlocked(kind, id);
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const listRef = useRef<FlatList>(null);

  const thread = threadQ.data;
  const isCreator = Boolean(thread && user && thread.createdByUserId === user.id);

  const notFound =
    threadQ.error instanceof ApiError &&
    (threadQ.error.status === 404 || threadQ.error.status === 403);
  if (notFound) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t(`kind.${kind}`)} showBack />
        <EmptyState
          icon="lock-closed-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('detail.back')}
          onAction={() => router.replace(Routes.support(meta.slug))}
        />
      </SafeAreaScreen>
    );
  }
  if (threadQ.isError) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t(`kind.${kind}`)} showBack />
        <ErrorState error={threadQ.error} onRetry={() => void threadQ.refetch()} />
      </SafeAreaScreen>
    );
  }

  const closed = thread?.status === 'CLOSED';
  const composerDisabledReason = closed
    ? t('detail.closedNotice')
    : isCreator && thread?.senderBlocked
      ? t('detail.blockedNotice')
      : null;

  const onSend = (body: string): void => {
    setSendError(null);
    send.mutate(
      { body },
      {
        onSuccess: () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50),
        onError: (error) => setSendError(supportErrorMessage(error, t)),
      },
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t(`kind.${kind}`)}
        showBack
        right={thread ? <ThreadStatusBadge status={thread.status} size="md" /> : undefined}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={theme.sizes.headerHeight}
      >
        {thread ? (
          <View
            style={{
              paddingHorizontal: theme.screenPadding,
              paddingVertical: theme.spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Row gap="sm" wrap align="center">
              {thread.animalId ? (
                <Row gap="xs" align="center">
                  <Icon name="paw-outline" size="iconXs" color="textSecondary" />
                  <Caption>{t('detail.hasAnimal')}</Caption>
                </Row>
              ) : null}
              {thread.aiResponded ? (
                <Row gap="xs" align="center">
                  <Icon name="sparkles-outline" size="iconXs" color="textSecondary" />
                  <Caption>{t('detail.aiReplied')}</Caption>
                </Row>
              ) : null}
            </Row>

            {canRespond || canClose ? (
              <Row gap="lg" style={{ marginTop: theme.spacing.xs }}>
                {canClose && !closed ? (
                  <TextButton
                    label={t('detail.closeCta')}
                    icon="checkmark-done-outline"
                    disabled={close.isPending}
                    onPress={() => setConfirmClose(true)}
                  />
                ) : null}
                {canRespond ? (
                  <TextButton
                    label={thread.senderBlocked ? t('detail.unblockCta') : t('detail.blockCta')}
                    icon={thread.senderBlocked ? 'volume-high-outline' : 'volume-mute-outline'}
                    tone={thread.senderBlocked ? undefined : 'danger'}
                    disabled={block.isPending}
                    onPress={() =>
                      block.mutate(
                        { blocked: !thread.senderBlocked },
                        {
                          onError: (error) =>
                            toast.show({
                              tone: 'danger',
                              message: supportErrorMessage(error, t),
                            }),
                        },
                      )
                    }
                  />
                ) : null}
              </Row>
            ) : null}
          </View>
        ) : null}

        {msgQ.isLoading ? (
          <Section spacing="xl">
            <SkeletonText lines={6} />
          </Section>
        ) : msgQ.isError ? (
          <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
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
            ListEmptyComponent={<EmptyState icon={meta.icon} title={t('detail.noMessages')} />}
            ListFooterComponent={
              msgQ.isFetchingNextPage ? <Loading label={t('common.loadingMore')} /> : null
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

        {isCreator || canRespond ? (
          <MessageComposer
            disabledReason={
              canRespond && !isCreator && closed ? t('detail.closedNotice') : composerDisabledReason
            }
            sending={send.isPending}
            error={sendError}
            onSend={onSend}
          />
        ) : null}
      </KeyboardAvoidingView>

      <ConfirmationDialog
        visible={confirmClose}
        title={t('detail.closeConfirmTitle')}
        message={t('detail.closeConfirmBody')}
        confirmLabel={t('detail.closeCta')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={close.isPending}
        onConfirm={() => {
          setConfirmClose(false);
          close.mutate(undefined, {
            onSuccess: () => toast.show({ tone: 'success', message: t('detail.closed') }),
            onError: (error) =>
              toast.show({ tone: 'danger', message: supportErrorMessage(error, t) }),
          });
        }}
        onCancel={() => setConfirmClose(false)}
      />
    </SafeAreaScreen>
  );
}
