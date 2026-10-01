import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Card } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, LinkifiedText, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { notificationKeys, notificationsApi } from '../api';
import { localizedNotificationText, notificationHref, notificationSourceName } from '../constants';
import { useMarkNotificationRead } from '../hooks';
import type { AppNotification } from '../types';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ rowGap: 2 }}>
      <Text variant="overline" color="textMuted">
        {label}
      </Text>
      {children}
    </View>
  );
}

/**
 * Route `/notifications/[notificationId]` — one notification in full: sender
 * ("From"), title, message, date, and a link to the related content when one
 * exists. Opened for messages (admin / organization broadcasts — their text is
 * stored nowhere else) and for any type without a destination screen.
 *
 * `GET /notifications/:id` is scoped to the caller server-side (another user's
 * id is a 404), so a guessed id only reaches the "unavailable" state. Opening
 * an unread notification marks it read on the server (idempotent), which
 * refetches the inbox and the unread badge.
 */
export default function NotificationDetailScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation('notifications');
  const { notificationId } = useLocalSearchParams<{ notificationId: string }>();
  const id = notificationId ?? '';

  const q = useQuery<AppNotification, ApiError>({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationsApi.get(id),
    enabled: Boolean(id),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 404 || error.status === 403)) && count < 2,
  });

  const { mutate: markRead } = useMarkNotificationRead();
  const markedRef = useRef<string | null>(null);
  useEffect(() => {
    const n = q.data;
    if (n && !n.read && markedRef.current !== n.id) {
      markedRef.current = n.id;
      markRead(n.id);
    }
  }, [q.data, markRead]);

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);

  const n = q.data;
  const text = n ? localizedNotificationText(n, t, i18n.language) : null;
  const related = n ? notificationHref(n) : null;
  const imageUrl = n && typeof n.data?.imageUrl === 'string' ? n.data.imageUrl : null;

  return (
    <ScrollScreen>
      <AppHeader title={t('detail.title')} showBack />
      {q.isLoading ? (
        <Loading fill label={t('loading')} />
      ) : notFound ? (
        <EmptyState
          icon="notifications-off-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('title')}
          onAction={() => router.replace(Routes.notifications)}
        />
      ) : q.isError || !n || !text ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <Section spacing="lg">
          <Card variant="outlined" padding="lg">
            <View style={{ rowGap: theme.spacing.lg }}>
              <Field label={t('detail.senderLabel')}>
                <Text variant="bodyMedium" weight="bold" color="primary">
                  {notificationSourceName(n.source, t)}
                </Text>
              </Field>
              <Field label={t('detail.titleLabel')}>
                <Text variant="title" weight="bold">
                  {text.title}
                </Text>
              </Field>
              {text.body ? (
                <Field label={t('detail.messageLabel')}>
                  <LinkifiedText variant="body">{text.body}</LinkifiedText>
                </Field>
              ) : null}
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: theme.radius.lg }}
                  contentFit="cover"
                />
              ) : null}
              <Field label={t('detail.dateLabel')}>
                <Caption>{formatDate(n.createdAt, i18n.language)}</Caption>
              </Field>
            </View>
          </Card>
          {related ? (
            <Button
              label={t('detail.openRelated')}
              variant="primary"
              onPress={() => router.push(related as never)}
            />
          ) : null}
        </Section>
      )}
    </ScrollScreen>
  );
}
