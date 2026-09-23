import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Card, Chip, Icon } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Modal } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { SyndicateSubmissionStatusBadge } from '../components';
import { useCloseSyndicateSubmission, useRespondToSyndicateSubmission, useSyndicateSubmissions } from '../hooks';
import type { SyndicateSubmission, SyndicateSubmissionKind } from '../types';

/**
 * Route `/(app)/syndicates/[organizationId]/submissions` — "الطلبات
 * والاستفسارات" management, reused by both a syndicate's assigned supervisor
 * and ADMIN (the backend's `syndicate.submission.read`/`respond` org-scoped
 * check decides who may actually act — see `organization-rbac.constants.ts`).
 */
export default function SyndicateSubmissionsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const [kind, setKind] = useState<SyndicateSubmissionKind | undefined>();
  const q = useSyndicateSubmissions(organizationId, { kind });
  const [responding, setResponding] = useState<SyndicateSubmission | null>(null);
  const [closing, setClosing] = useState<SyndicateSubmission | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  return (
    <SafeAreaScreen>
      <AppHeader title={t('management.submissionsTitle')} showBack />
      <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm, paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <Chip label={t('management.filterAll')} selected={!kind} onPress={() => setKind(undefined)} />
        <Chip label={t('management.filterInquiries')} selected={kind === 'INQUIRY'} onPress={() => setKind('INQUIRY')} />
        <Chip label={t('management.filterRequests')} selected={kind === 'REQUEST'} onPress={() => setKind('REQUEST')} />
      </View>

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.submissions}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                <Icon name="person-circle-outline" size="iconMd" color="primary" />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {item.submittedBy.firstName} {item.submittedBy.lastName}
                  </Text>
                  <Caption>{formatDate(item.createdAt)}</Caption>
                </View>
                <SyndicateSubmissionStatusBadge status={item.status} />
              </View>
              {item.requestType ? <Text variant="label">{t(`requestType.${item.requestType}`)}</Text> : null}
              <Text variant="body" numberOfLines={4}>
                {item.message}
              </Text>
              {item.attachmentUrls.length > 0 ? (
                <View style={{ rowGap: theme.spacing.xs }}>
                  <Caption color="textMuted">{t('management.attachmentsLabel')}</Caption>
                  <ImageThumbnailRow
                    images={item.attachmentUrls}
                    size={64}
                    onPress={(index) => setViewer({ images: item.attachmentUrls, index })}
                  />
                </View>
              ) : null}
              {item.responseText ? (
                <View style={{ rowGap: 2 }}>
                  <Caption color="textMuted">{t('mySubmissions.responseLabel')}</Caption>
                  <Text variant="body" color="textSecondary">
                    {item.responseText}
                  </Text>
                </View>
              ) : null}
              {item.status !== 'CLOSED' ? (
                <View style={{ flexDirection: 'row', columnGap: theme.spacing.md, marginTop: theme.spacing.xs }}>
                  {item.status === 'PENDING' ? (
                    <TextButton label={t('management.respond')} onPress={() => setResponding(item)} />
                  ) : null}
                  <TextButton label={t('management.close')} tone="danger" onPress={() => setClosing(item)} />
                </View>
              ) : null}
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title={t('management.empty')} />}
          contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge }}
        />
      )}

      <RespondDialog organizationId={organizationId} submission={responding} onClose={() => setResponding(null)} />

      <CloseConfirmDialog organizationId={organizationId} submission={closing} onClose={() => setClosing(null)} />

      <ImageViewer
        visible={viewer !== null}
        images={viewer?.images ?? []}
        initialIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
    </SafeAreaScreen>
  );
}

function RespondDialog({
  organizationId,
  submission,
  onClose,
}: {
  organizationId: string;
  submission: SyndicateSubmission | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const respond = useRespondToSyndicateSubmission(organizationId);
  // Pre-filled so a test response needs no typing — the field stays editable.
  const { control, handleSubmit, reset } = useForm<{ responseText: string }>({
    defaultValues: { responseText: 'شكراً لتواصلكم، تم استلام طلبكم وسيتم الرد عليه في أقرب وقت ممكن.' },
  });

  const onSubmit = (values: { responseText: string }): void => {
    if (!submission || !values.responseText.trim()) return;
    respond.mutate(
      { id: submission.id, responseText: values.responseText.trim() },
      {
        onSuccess: () => {
          toast.show({ message: t('management.responded'), tone: 'success' });
          reset();
          onClose();
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  return (
    <Modal visible={submission != null} onClose={onClose} title={t('management.responseLabel')}>
      <FormField
        control={control}
        name="responseText"
        placeholder={t('management.responsePlaceholder')}
        multiline
        numberOfLines={4}
      />
      <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button label={t('management.responseSubmit')} loading={respond.isPending} fullWidth onPress={handleSubmit(onSubmit)} />
        </View>
        <TextButton label={tc('actions.cancel')} onPress={onClose} />
      </View>
    </Modal>
  );
}

function CloseConfirmDialog({
  organizationId,
  submission,
  onClose,
}: {
  organizationId: string;
  submission: SyndicateSubmission | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const close = useCloseSyndicateSubmission(organizationId);

  return (
    <ConfirmationDialog
      visible={submission != null}
      title={t('management.closeConfirmTitle')}
      message={t('management.closeConfirmBody')}
      confirmLabel={t('management.close')}
      destructive
      loading={close.isPending}
      onConfirm={() => {
        if (!submission) return;
        close.mutate(submission.id, {
          onSuccess: () => {
            toast.show({ message: t('management.closed'), tone: 'success' });
            onClose();
          },
          onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
        });
      }}
      onCancel={onClose}
    />
  );
}
