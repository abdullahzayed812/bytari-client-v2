import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Badge, Card, Divider } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  SkeletonText,
  useToast,
} from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { farmErrorMessage } from '@/features/farmShared';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { FLOCK_STATUS_TONE } from '../constants';
import { useDeletePoultryFlock, usePoultryFlock, useUpdatePoultryFlock } from '../hooks';

/**
 * Route `/organizations/[organizationId]/poultry/[flockId]`. Sections map 1:1 to
 * backend fields (§14) — there is no health / production / feed / mortality data
 * in the backend, so no such sections exist here.
 */
export default function PoultryFlockDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId, flockId } = useLocalSearchParams<{
    organizationId: string;
    flockId: string;
  }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const q = usePoultryFlock(orgId, flockId);
  const update = useUpdatePoultryFlock(orgId);
  const del = useDeletePoultryFlock(orgId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('poultry.detailTitle')} showBack />
        <EmptyState
          icon="help-circle-outline"
          title={t('poultry.notFoundTitle')}
          message={t('poultry.notFoundBody')}
          actionLabel={t('poultry.backToList')}
          onAction={() => router.replace(Routes.organizationPoultry(orgId))}
        />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('poultry.detailTitle')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const flock = q.data;
  const canManage = caps.canManageFarmPoultry;
  const busy = update.isPending || del.isPending;

  const toggleStatus = () => {
    if (!flock) return;
    const next = flock.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    update.mutate(
      { flockId: flock.id, body: { status: next } },
      {
        onSuccess: () =>
          toast.show({
            tone: 'success',
            message: next === 'CLOSED' ? t('poultry.closed') : t('poultry.reopened'),
          }),
        onError: (error) => toast.show({ tone: 'danger', message: farmErrorMessage(error, t) }),
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('poultry.detailTitle')} showBack />

      {q.isLoading || !flock ? (
        <Section spacing="xl">
          <SkeletonText lines={6} />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            <Row justify="space-between" align="center">
              <Heading level={2} numberOfLines={2} style={{ flex: 1 }}>
                {flock.name}
              </Heading>
              <Badge
                label={t(`flockStatus.${flock.status}`)}
                tone={FLOCK_STATUS_TONE[flock.status]}
                size="md"
              />
            </Row>
          </Section>

          <Section spacing="xl">
            <Label>{t('poultry.sectionBasic')}</Label>
            <Card variant="outlined">
              <Field label={t('poultry.fieldName')} value={flock.name} />
              <Divider spacing="sm" />
              <Field
                label={t('poultry.fieldBirdType')}
                value={t(`birdType.${flock.birdType}`, { defaultValue: flock.birdType })}
              />
              <Divider spacing="sm" />
              <Field label={t('poultry.fieldBirdCount')} value={String(flock.birdCount)} />
              <Divider spacing="sm" />
              <Field label={t('poultry.fieldArrivalDate')} value={flock.arrivalDate} />
              <Divider spacing="sm" />
              <Field label={t('poultry.fieldStatus')} value={t(`flockStatus.${flock.status}`)} />
            </Card>
          </Section>

          {flock.notes ? (
            <Section spacing="xl">
              <Label>{t('poultry.fieldNotes')}</Label>
              <Card variant="outlined" padding="md">
                <Text variant="body">{flock.notes}</Text>
              </Card>
            </Section>
          ) : null}

          <Section spacing="xl">
            <Card variant="outlined" padding="md">
              <Field label={t('common.recordedAt')} value={formatDate(flock.createdAt)} />
              {flock.closedAt ? (
                <>
                  <Divider spacing="sm" />
                  <Field label={t('poultry.fieldClosedAt')} value={formatDate(flock.closedAt)} />
                </>
              ) : null}
            </Card>
          </Section>

          {canManage ? (
            <>
              <Button
                label={t('poultry.editCta')}
                variant="outline"
                leftIcon="create-outline"
                disabled={busy}
                onPress={() => router.push(Routes.organizationPoultryFlockEdit(orgId, flock.id))}
              />
              <View style={{ marginTop: theme.spacing.md }}>
                <Button
                  label={flock.status === 'ACTIVE' ? t('poultry.closeCta') : t('poultry.reopenCta')}
                  variant="ghost"
                  disabled={busy}
                  onPress={toggleStatus}
                />
              </View>
              <View style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
                <TextButton
                  label={t('poultry.deleteCta')}
                  tone="danger"
                  icon="trash-outline"
                  disabled={busy}
                  onPress={() => setConfirmDelete(true)}
                />
              </View>
            </>
          ) : null}

          <ConfirmationDialog
            visible={confirmDelete}
            title={t('poultry.deleteConfirmTitle')}
            message={t('poultry.deleteConfirmBody')}
            confirmLabel={t('poultry.deleteCta')}
            cancelLabel={t('common.cancel')}
            destructive
            loading={del.isPending}
            onConfirm={() => {
              setConfirmDelete(false);
              del.mutate(
                { flockId: flock.id },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('poultry.deleteSuccess') });
                    router.replace(Routes.organizationPoultry(orgId));
                  },
                  onError: (error) =>
                    toast.show({ tone: 'danger', message: farmErrorMessage(error, t) }),
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
