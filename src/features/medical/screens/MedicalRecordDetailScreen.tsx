import { router } from 'expo-router';
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
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { UserName } from '@/features/users/components';
import { useCapabilities } from '@/hooks';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { displayDateOnly, recordedByThisClinic } from '../constants';
import { useDeleteMedicalRecord, useMedicalRecord } from '../hooks';
import { medicalErrorMessage } from '../validation/schemas';

import { useMedicalRouteScope } from './useMedicalRouteScope';

/** One medical record — read view for owners, editable for the clinic that recorded it. */
export default function MedicalRecordDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const toast = useToast();
  const { animalId, organizationId, isClinic, recordId } = useMedicalRouteScope();
  const { isAdmin } = useCapabilities();

  const orgDetail = useOrganization(organizationId, { enabled: isClinic });
  const caps = orgCapabilities(orgDetail.data?.myRole, isAdmin);
  const q = useMedicalRecord({ animalId, organizationId }, recordId);
  const del = useDeleteMedicalRecord(organizationId ?? '', animalId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const listRoute = isClinic
    ? Routes.orgAnimalMedicalRecords(organizationId as string, animalId)
    : Routes.petMedicalRecords(animalId);

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('records.detailTitle')} showBack />
        <EmptyState
          icon="help-circle-outline"
          title={t('records.notFoundTitle')}
          message={t('records.notFoundBody')}
          actionLabel={t('records.backToList')}
          onAction={() => router.replace(listRoute)}
        />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('records.detailTitle')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const record = q.data;
  const mine = record ? recordedByThisClinic(record, organizationId) : false;
  const canEdit = isClinic && caps.canManageOrganizationMedical && mine;

  return (
    <ScrollScreen>
      <AppHeader title={t('records.detailTitle')} showBack />

      {q.isLoading || !record ? (
        <Section spacing="xl">
          <SkeletonText lines={6} />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            <Row justify="space-between" align="center">
              <Heading level={2}>{displayDateOnly(record.visitDate)}</Heading>
              {isClinic ? (
                <Badge
                  label={mine ? t('records.recordedHere') : t('records.recordedElsewhere')}
                  tone={mine ? 'success' : 'neutral'}
                  size="md"
                />
              ) : null}
            </Row>
          </Section>

          <Section spacing="xl">
            <Card variant="outlined">
              <Field
                label={t('records.fieldVisitDate')}
                value={displayDateOnly(record.visitDate)}
              />
              <Divider spacing="sm" />
              <Field label={t('records.fieldReason')} value={record.reason} />
              <Divider spacing="sm" />
              <Field label={t('records.fieldDiagnosis')} value={record.diagnosis} />
              <Divider spacing="sm" />
              <Field label={t('records.fieldTreatment')} value={record.treatment} />
              <Divider spacing="sm" />
              <Field label={t('records.fieldNotes')} value={record.notes} />
            </Card>
          </Section>

          <Section spacing="xl">
            <Card variant="outlined" padding="md">
              <Field label={t('common.recordedAt')} value={formatDate(record.createdAt)} oneLine />
              {record.updatedAt !== record.createdAt ? (
                <>
                  <Divider spacing="sm" />
                  <Field
                    label={t('common.updatedAt')}
                    value={formatDate(record.updatedAt)}
                    oneLine
                  />
                </>
              ) : null}
              {record.recordedByUserId ? (
                <>
                  <Divider spacing="sm" />
                  <Row justify="space-between" align="center">
                    <Caption>{t('records.recordedBy')}</Caption>
                    <UserName
                      userId={record.recordedByUserId}
                      variant="bodyMedium"
                      numberOfLines={1}
                      style={{ maxWidth: '60%' }}
                    />
                  </Row>
                </>
              ) : null}
              <Divider spacing="sm" />
              <Caption>{t('common.recordedByNote')}</Caption>
            </Card>
          </Section>

          {canEdit ? (
            <>
              <Button
                label={t('records.editCta')}
                variant="outline"
                leftIcon="create-outline"
                onPress={() =>
                  router.push(
                    Routes.orgAnimalMedicalRecordEdit(
                      organizationId as string,
                      animalId,
                      record.id,
                    ),
                  )
                }
              />
              <View style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
                <TextButton
                  label={t('records.deleteCta')}
                  tone="danger"
                  icon="trash-outline"
                  disabled={del.isPending}
                  onPress={() => setConfirmDelete(true)}
                />
              </View>
            </>
          ) : isClinic && !mine ? (
            <Caption>{t('records.otherClinicNote')}</Caption>
          ) : null}

          <ConfirmationDialog
            visible={confirmDelete}
            title={t('records.deleteConfirmTitle')}
            message={t('records.deleteConfirmBody')}
            confirmLabel={t('records.deleteCta')}
            cancelLabel={t('common.cancel')}
            destructive
            loading={del.isPending}
            onConfirm={() => {
              setConfirmDelete(false);
              del.mutate(
                { recordId: record.id },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('records.deleteSuccess') });
                    router.replace(listRoute);
                  },
                  onError: (error) =>
                    toast.show({ tone: 'danger', message: medicalErrorMessage(error, t) }),
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

function Field({
  label,
  value,
  oneLine,
}: {
  label: string;
  value: string | null;
  oneLine?: boolean;
}) {
  const { t } = useTranslation('medical');
  if (oneLine) {
    return (
      <Row justify="space-between" align="center">
        <Caption>{label}</Caption>
        <Text variant="bodyMedium">{value ?? t('common.noValue')}</Text>
      </Row>
    );
  }
  return (
    <View style={{ rowGap: 4 }}>
      <Label>{label}</Label>
      <Text variant="body" color={value ? 'textPrimary' : 'textMuted'}>
        {value && value.trim() ? value : t('common.noValue')}
      </Text>
    </View>
  );
}
