import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { TextButton } from '@/components/actions';
import { Badge, Card, Divider, Icon, type IconName } from '@/components/content';
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
import { FutureSectionRow } from '@/features/pets';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { ANIMAL_STATUS_TONE, CLINIC_ACCESS_STATUS_TONE, animalSpeciesIcon } from '../constants';
import { useOrganizationAnimal, useRevokeOrganizationAnimalAccess } from '../hooks';

/**
 * Route `/organizations/[organizationId]/animals/[animalId]`.
 *
 * Structured so later phases can slot Medical Records / Vaccinations /
 * Treatments / Appointments under "Overview" without a redesign (§14). Those
 * rows are disabled placeholders here — no business logic.
 *
 * The screen clearly separates ANIMAL information from OWNER information: the
 * backend does not disclose the animal's owner to an organization in Phase 5,
 * so the owner block states that explicitly rather than inventing fields (§8/§12).
 */
export default function OrganizationAnimalDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId, animalId } = useLocalSearchParams<{
    organizationId: string;
    animalId: string;
  }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const q = useOrganizationAnimal(orgId, animalId);
  const revoke = useRevokeOrganizationAnimalAccess(orgId);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const forbidden = q.error instanceof ApiError && q.error.status === 403;

  if (forbidden) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon="lock-closed-outline"
          title={t('detail.notAvailableTitle')}
          message={t('detail.notAvailableBody')}
          actionLabel={t('detail.backToList')}
          onAction={() => router.replace(Routes.organizationAnimals(orgId))}
        />
      </ScrollScreen>
    );
  }

  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const grant = q.data;

  if (!q.isLoading && !grant) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon="help-circle-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('detail.backToList')}
          onAction={() => router.replace(Routes.organizationAnimals(orgId))}
        />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <AppHeader title={t('detail.title')} showBack />

      {q.isLoading || !grant ? (
        <Section spacing="xl">
          <SkeletonText lines={2} />
          <View style={{ marginTop: theme.spacing.xl }}>
            <SkeletonText lines={5} />
          </View>
        </Section>
      ) : (
        <>
          <Section spacing="xl">
            <Row gap="lg" align="center">
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: theme.radius.xl,
                  backgroundColor: theme.colors.surfaceAccent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={animalSpeciesIcon(grant.animal.species)}
                  size="iconLg"
                  color="primary"
                />
              </View>
              <View style={{ flex: 1, rowGap: 4 }}>
                <Heading level={2} numberOfLines={1}>
                  {grant.animal.name}
                </Heading>
                <Row gap="xs" wrap>
                  <Badge
                    label={t(`species.${grant.animal.species}`, {
                      defaultValue: grant.animal.species,
                    })}
                    tone="primary"
                    size="sm"
                  />
                  <Badge
                    label={t(`accessStatus.${grant.status}`)}
                    tone={CLINIC_ACCESS_STATUS_TONE[grant.status]}
                    size="sm"
                  />
                  {grant.animal.status !== 'ACTIVE' ? (
                    <Badge
                      label={t(`animalStatus.${grant.animal.status}`, {
                        defaultValue: grant.animal.status,
                      })}
                      tone={ANIMAL_STATUS_TONE[grant.animal.status] ?? 'neutral'}
                      size="sm"
                    />
                  ) : null}
                </Row>
              </View>
            </Row>
          </Section>

          {/* --- Overview: animal information ------------------------- */}
          <Section spacing="xl">
            <Label>{t('detail.overview')}</Label>
            <Card variant="outlined">
              <InfoRow
                label={t('detail.fieldSpecies')}
                value={t(`species.${grant.animal.species}`, { defaultValue: grant.animal.species })}
              />
              <Divider spacing="sm" />
              <InfoRow
                label={t('detail.fieldAnimalStatus')}
                value={t(`animalStatus.${grant.animal.status}`, {
                  defaultValue: grant.animal.status,
                })}
              />
              <Divider spacing="sm" />
              <InfoRow
                label={t('detail.fieldAccessStatus')}
                value={t(`accessStatus.${grant.status}`)}
              />
              <Divider spacing="sm" />
              <InfoRow label={t('detail.fieldGrantedAt')} value={formatDate(grant.createdAt)} />
            </Card>
            <Caption style={{ marginTop: theme.spacing.xs }}>{t('detail.fieldsNote')}</Caption>
          </Section>

          {/* --- Owner information (not disclosed to the organization) --- */}
          <Section spacing="xl">
            <Label>{t('detail.ownerSection')}</Label>
            <Card variant="outlined" padding="md">
              <Row gap="md">
                <Icon name="person-outline" size="iconMd" color="textMuted" />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" color="textSecondary">
                    {t('detail.ownerHiddenTitle')}
                  </Text>
                  <Caption>{t('detail.ownerHiddenBody')}</Caption>
                </View>
              </Row>
            </Card>
          </Section>

          {/* --- Medical modules (Phase 6 live; treatments/appointments future) --- */}
          <Section spacing="xl">
            <Label>{t('detail.medicalSection')}</Label>
            <View style={{ rowGap: theme.spacing.sm }}>
              {caps.canViewOrganizationMedical ? (
                <>
                  <MedicalNavRow
                    icon="time-outline"
                    label={t('detail.medicalHistory')}
                    onPress={() =>
                      router.push(Routes.orgAnimalMedicalHistory(orgId, grant.animalId))
                    }
                  />
                  <MedicalNavRow
                    icon="medkit-outline"
                    label={t('detail.medicalRecords')}
                    onPress={() =>
                      router.push(Routes.orgAnimalMedicalRecords(orgId, grant.animalId))
                    }
                  />
                  <MedicalNavRow
                    icon="shield-checkmark-outline"
                    label={t('detail.vaccinations')}
                    onPress={() => router.push(Routes.orgAnimalVaccinations(orgId, grant.animalId))}
                  />
                </>
              ) : (
                <>
                  <FutureSectionRow icon="time-outline" label={t('detail.medicalHistory')} />
                  <FutureSectionRow icon="medkit-outline" label={t('detail.medicalRecords')} />
                  <FutureSectionRow
                    icon="shield-checkmark-outline"
                    label={t('detail.vaccinations')}
                  />
                </>
              )}
              <FutureSectionRow icon="bandage-outline" label={t('detail.treatments')} />
              <FutureSectionRow icon="calendar-outline" label={t('detail.appointments')} />
            </View>
          </Section>

          {caps.canManageOrganizationAnimalAccess && grant.status === 'ACTIVE' ? (
            <View style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
              <TextButton
                label={t('detail.revoke')}
                tone="danger"
                icon="close-circle-outline"
                disabled={revoke.isPending}
                onPress={() => setConfirmRevoke(true)}
              />
            </View>
          ) : null}

          <ConfirmationDialog
            visible={confirmRevoke}
            title={t('detail.revokeConfirmTitle')}
            message={t('detail.revokeConfirmBody')}
            confirmLabel={t('detail.revoke')}
            cancelLabel={t('common.cancel')}
            destructive
            loading={revoke.isPending}
            onConfirm={() => {
              setConfirmRevoke(false);
              revoke.mutate(
                { animalId: grant.animalId },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('detail.revokeSuccess') });
                    router.replace(Routes.organizationAnimals(orgId));
                  },
                  onError: (error) =>
                    toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                },
              );
            }}
            onCancel={() => setConfirmRevoke(false)}
          />
        </>
      )}
    </ScrollScreen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Row justify="space-between" align="center">
      <Caption>{label}</Caption>
      <Text variant="bodyMedium" numberOfLines={1} style={{ maxWidth: '60%' }}>
        {value}
      </Text>
    </Row>
  );
}

function MedicalNavRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Card variant="outlined" padding="md" onPress={onPress} accessibilityLabel={label}>
      <Row gap="md">
        <Icon name={icon} size="iconMd" color="primary" />
        <Text variant="bodyMedium" style={{ flex: 1 }}>
          {label}
        </Text>
        <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
      </Row>
    </Card>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 10);
}
