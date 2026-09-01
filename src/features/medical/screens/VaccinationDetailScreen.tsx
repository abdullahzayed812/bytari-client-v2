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
import { useDeleteVaccination, useVaccination } from '../hooks';
import { medicalErrorMessage } from '../validation/schemas';

import { useMedicalRouteScope } from './useMedicalRouteScope';

/** One vaccination — read view for owners, editable for the clinic that recorded it. */
export default function VaccinationDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const toast = useToast();
  const { animalId, organizationId, isClinic, vaccinationId } = useMedicalRouteScope();
  const { isAdmin } = useCapabilities();

  const orgDetail = useOrganization(organizationId, { enabled: isClinic });
  const caps = orgCapabilities(orgDetail.data?.myRole, isAdmin);
  const q = useVaccination({ animalId, organizationId }, vaccinationId);
  const del = useDeleteVaccination(organizationId ?? '', animalId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const listRoute = isClinic
    ? Routes.orgAnimalVaccinations(organizationId as string, animalId)
    : Routes.petVaccinations(animalId);

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('vaccinations.detailTitle')} showBack />
        <EmptyState
          icon="help-circle-outline"
          title={t('vaccinations.notFoundTitle')}
          message={t('vaccinations.notFoundBody')}
          actionLabel={t('vaccinations.backToList')}
          onAction={() => router.replace(listRoute)}
        />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('vaccinations.detailTitle')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const v = q.data;
  const mine = v ? recordedByThisClinic(v, organizationId) : false;
  const canEdit = isClinic && caps.canManageOrganizationMedical && mine;

  return (
    <ScrollScreen>
      <AppHeader title={t('vaccinations.detailTitle')} showBack />

      {q.isLoading || !v ? (
        <Section spacing="xl">
          <SkeletonText lines={5} />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            <Row justify="space-between" align="center">
              <Heading level={2} numberOfLines={2} style={{ flex: 1 }}>
                {v.vaccineName}
              </Heading>
              {isClinic ? (
                <Badge
                  label={
                    mine ? t('vaccinations.recordedHere') : t('vaccinations.recordedElsewhere')
                  }
                  tone={mine ? 'success' : 'neutral'}
                  size="md"
                />
              ) : null}
            </Row>
          </Section>

          <Section spacing="xl">
            <Card variant="outlined">
              <Field label={t('vaccinations.fieldVaccineName')} value={v.vaccineName} />
              <Divider spacing="sm" />
              <Field
                label={t('vaccinations.fieldAdministeredOn')}
                value={displayDateOnly(v.administeredOn)}
              />
              <Divider spacing="sm" />
              <Field
                label={t('vaccinations.fieldNextDueOn')}
                value={v.nextDueOn ? displayDateOnly(v.nextDueOn) : null}
              />
              <Divider spacing="sm" />
              <Field label={t('vaccinations.fieldNotes')} value={v.notes} />
            </Card>
          </Section>

          <Section spacing="xl">
            <Card variant="outlined" padding="md">
              <Field label={t('common.recordedAt')} value={formatDate(v.createdAt)} oneLine />
              {v.recordedByUserId ? (
                <>
                  <Divider spacing="sm" />
                  <Row justify="space-between" align="center">
                    <Caption>{t('vaccinations.recordedBy')}</Caption>
                    <UserName
                      userId={v.recordedByUserId}
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
                label={t('vaccinations.editCta')}
                variant="outline"
                leftIcon="create-outline"
                onPress={() =>
                  router.push(
                    Routes.orgAnimalVaccinationEdit(organizationId as string, animalId, v.id),
                  )
                }
              />
              <View style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
                <TextButton
                  label={t('vaccinations.deleteCta')}
                  tone="danger"
                  icon="trash-outline"
                  disabled={del.isPending}
                  onPress={() => setConfirmDelete(true)}
                />
              </View>
            </>
          ) : isClinic && !mine ? (
            <Caption>{t('vaccinations.otherClinicNote')}</Caption>
          ) : null}

          <ConfirmationDialog
            visible={confirmDelete}
            title={t('vaccinations.deleteConfirmTitle')}
            message={t('vaccinations.deleteConfirmBody')}
            confirmLabel={t('vaccinations.deleteCta')}
            cancelLabel={t('common.cancel')}
            destructive
            loading={del.isPending}
            onConfirm={() => {
              setConfirmDelete(false);
              del.mutate(
                { vaccinationId: v.id },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('vaccinations.deleteSuccess') });
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
