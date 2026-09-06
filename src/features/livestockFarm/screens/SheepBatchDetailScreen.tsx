import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Badge, Card, Divider } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, SkeletonText, useToast } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { BATCH_STATUS_TONE } from '../constants';
import { useDeleteSheepBatch, useSheepBatch, useUpdateSheepBatch } from '../hooks';

/** Route `/(app)/livestock/sheep/[organizationId]/batches/[batchId]`. Mirrors `PoultryFlockDetailScreen`. */
export default function SheepBatchDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const toast = useToast();
  const { organizationId, batchId } = useLocalSearchParams<{ organizationId: string; batchId: string }>();
  const orgId = organizationId ?? '';

  const q = useSheepBatch(orgId, batchId);
  const update = useUpdateSheepBatch(orgId);
  const del = useDeleteSheepBatch(orgId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const notFound = q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('batchDetail.title')} showBack />
        <EmptyState icon="help-circle-outline" title={t('batchDetail.notFoundTitle')} actionLabel={t('batchDetail.backToList')} onAction={() => router.replace(Routes.sheepBatches(orgId))} />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('batchDetail.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const batch = q.data;
  const busy = update.isPending || del.isPending;

  const toggleStatus = () => {
    if (!batch) return;
    const next = batch.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    update.mutate(
      { batchId: batch.id, body: { status: next } },
      {
        onSuccess: () => toast.show({ tone: 'success', message: next === 'CLOSED' ? t('batchDetail.closed') : t('batchDetail.reopened') }),
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('batchDetail.title')} showBack />

      {q.isLoading || !batch ? (
        <Section spacing="xl">
          <SkeletonText lines={6} />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            <Row justify="space-between" align="center">
              <Heading level={2} numberOfLines={2} style={{ flex: 1 }}>
                {batch.name}
              </Heading>
              <Badge label={t(`batch.status${batch.status === 'ACTIVE' ? 'Active' : 'Closed'}`)} tone={BATCH_STATUS_TONE[batch.status]} size="md" />
            </Row>
          </Section>

          <Section spacing="xl">
            <Label>{t('batchDetail.sectionBasic')}</Label>
            <Card variant="outlined">
              <Field label={t('batchForm.fieldBreed')} value={batch.breed ?? t('daily.none')} />
              <Divider spacing="sm" />
              <Field label={t('batchForm.fieldHeadCount')} value={String(batch.headCount)} />
              <Divider spacing="sm" />
              <Field label={t('batchForm.fieldLambCount')} value={String(batch.lambCount ?? 0)} />
              <Divider spacing="sm" />
              <Field label={t('batchForm.fieldMaleCount')} value={String(batch.maleCount ?? 0)} />
              <Divider spacing="sm" />
              <Field label={t('batchForm.fieldFemaleCount')} value={String(batch.femaleCount ?? 0)} />
              <Divider spacing="sm" />
              <Field label={t('batchForm.fieldArrivalDate')} value={batch.arrivalDate} />
            </Card>
          </Section>

          {batch.notes ? (
            <Section spacing="xl">
              <Label>{t('batchForm.fieldNotes')}</Label>
              <Card variant="outlined" padding="md">
                <Text variant="body">{batch.notes}</Text>
              </Card>
            </Section>
          ) : null}

          <Section spacing="xl">
            <Card variant="outlined" padding="md">
              <Field label={t('common.recordedAt')} value={formatDate(batch.createdAt)} />
              {batch.closedAt ? (
                <>
                  <Divider spacing="sm" />
                  <Field label={t('batchDetail.fieldClosedAt')} value={formatDate(batch.closedAt)} />
                </>
              ) : null}
            </Card>
          </Section>

          <Button label={t('batchDetail.editCta')} variant="outline" leftIcon="create-outline" disabled={busy} onPress={() => router.push(Routes.sheepBatchEdit(orgId, batch.id))} />
          <View style={{ marginTop: theme.spacing.md }}>
            <Button label={batch.status === 'ACTIVE' ? t('batchDetail.closeCta') : t('batchDetail.reopenCta')} variant="ghost" disabled={busy} onPress={toggleStatus} />
          </View>
          <View style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
            <TextButton label={t('batchDetail.deleteCta')} tone="danger" icon="trash-outline" disabled={busy} onPress={() => setConfirmDelete(true)} />
          </View>

          <ConfirmationDialog
            visible={confirmDelete}
            title={t('batchDetail.deleteConfirmTitle')}
            message={t('batchDetail.deleteConfirmBody')}
            confirmLabel={t('batchDetail.deleteCta')}
            cancelLabel={t('common.cancel')}
            destructive
            loading={del.isPending}
            onConfirm={() => {
              setConfirmDelete(false);
              del.mutate(
                { batchId: batch.id },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('batchDetail.deleteSuccess') });
                    router.replace(Routes.sheepBatches(orgId));
                  },
                  onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                },
              );
            }}
            onCancel={() => setConfirmDelete(false)}
          />
        </>
      )}
    </ScrollScreen>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Row justify="space-between" align="center">
      <Caption>{label}</Caption>
      <Text variant="bodyMedium" numberOfLines={1} style={{ maxWidth: '60%' }}>
        {value}
      </Text>
    </Row>
  );
}
