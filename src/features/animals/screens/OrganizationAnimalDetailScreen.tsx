import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Badge, Card, Divider, Icon, type IconName } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  SkeletonText,
  useToast,
} from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { ImageViewer } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
// Deep import (not the barrel) — keeps animals ↔ clinicDashboard acyclic.
import { useClinicPermissions } from '@/features/clinicDashboard/hooks';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { PetImage, petAge } from '@/features/pets';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { ANIMAL_STATUS_TONE, CLINIC_ACCESS_STATUS_TONE } from '../constants';
import { useClinicAnimalProfile, useRevokeOrganizationAnimalAccess } from '../hooks';
import type { ClinicAnimalProfile } from '../types';

/**
 * Route `/organizations/[organizationId]/animals/[animalId]` — the clinic's
 * "pet details" (migrated from the legacy `bytari` `(tabs)/pet-details`
 * clinic mode).
 *
 * Reads `GET /organizations/:id/animals/:animalId` — the clinic-visible
 * profile, available only while the clinic holds an ACTIVE grant (404
 * otherwise, so Clinic A can never open an animal only Clinic B treats). The
 * screen keeps ANIMAL information separate from OWNER information: the backend
 * never discloses the owner to an organization, so the owner block states that
 * explicitly. Medical work happens in the existing medical screens linked here;
 * action visibility comes from the backend-computed clinic permissions (falling
 * back to the `myRole` heuristic until they load).
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
  const perms = useClinicPermissions(orgId);
  const can = {
    viewRecords: perms ? perms.canViewMedicalRecords : caps.canViewOrganizationMedical,
    viewVaccinations: perms ? perms.canViewVaccinations : caps.canViewOrganizationMedical,
    createRecord: perms ? perms.canCreateMedicalRecords : caps.canManageOrganizationMedical,
    createVaccination: perms ? perms.canCreateVaccinations : caps.canManageOrganizationMedical,
    revoke: perms ? perms.canManageAnimalAccess : caps.canManageOrganizationAnimalAccess,
    viewAppointments: perms?.canViewAppointments ?? false,
  };

  const q = useClinicAnimalProfile(orgId, animalId);
  const revoke = useRevokeOrganizationAnimalAccess(orgId);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const status = q.error instanceof ApiError ? q.error.status : undefined;

  if (status === 403) {
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

  if (status === 404) {
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

  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const animal = q.data;
  const isActiveAnimal = animal?.status === 'ACTIVE';

  return (
    <ScrollScreen>
      <AppHeader title={t('detail.title')} showBack />

      {q.isLoading || !animal ? (
        <Section spacing="xl">
          <SkeletonText lines={2} />
          <View style={{ marginTop: theme.spacing.xl }}>
            <SkeletonText lines={5} />
          </View>
        </Section>
      ) : (
        <>
          {/* --- Hero: photo, name, badges ------------------------------- */}
          <Section spacing="xl">
            <Row gap="lg" align="center">
              <Pressable
                disabled={animal.galleryUrls.length === 0}
                onPress={() => setViewerOpen(true)}
                accessibilityRole={animal.galleryUrls.length > 0 ? 'imagebutton' : undefined}
                accessibilityLabel={t('detail.openPhoto')}
              >
                <PetImage
                  uri={animal.galleryUrls[0] ?? null}
                  species={animal.species}
                  size={88}
                  rounded="xl"
                />
              </Pressable>
              <View style={{ flex: 1, rowGap: 4 }}>
                <Heading level={2} numberOfLines={1}>
                  {animal.name}
                </Heading>
                <Row gap="xs" wrap>
                  <Badge
                    label={t(`species.${animal.species}`, { defaultValue: animal.species })}
                    tone="primary"
                    size="sm"
                  />
                  {animal.access ? (
                    <Badge
                      label={t('accessStatus.ACTIVE')}
                      tone={CLINIC_ACCESS_STATUS_TONE.ACTIVE}
                      size="sm"
                    />
                  ) : null}
                  {!isActiveAnimal ? (
                    <Badge
                      label={t(`animalStatus.${animal.status}`, { defaultValue: animal.status })}
                      tone={ANIMAL_STATUS_TONE[animal.status] ?? 'neutral'}
                      size="sm"
                    />
                  ) : null}
                </Row>
              </View>
            </Row>
          </Section>

          {/* --- Clinic stats ----------------------------------------- */}
          <Section spacing="lg">
            <Card variant="outlined" padding="md">
              <Row justify="space-around" align="center">
                <StatItem
                  value={String(animal.stats.vaccinationsCount)}
                  label={t('detail.statVaccinations')}
                />
                <StatItem
                  value={String(animal.stats.medicalRecordsCount)}
                  label={t('detail.statVisits')}
                />
                <StatItem
                  value={animal.stats.lastVisitDate ? formatDate(animal.stats.lastVisitDate) : '—'}
                  label={t('detail.statLastVisit')}
                />
                <StatItem
                  value={
                    animal.stats.nextVaccinationDue
                      ? formatDate(animal.stats.nextVaccinationDue)
                      : '—'
                  }
                  label={t('detail.statNextDue')}
                />
              </Row>
            </Card>
          </Section>

          {/* --- Clinic actions ---------------------------------------- */}
          {isActiveAnimal && (can.createRecord || can.createVaccination) ? (
            <Section spacing="lg">
              <Label>{t('detail.actionsSection')}</Label>
              <Row gap="sm">
                {can.createRecord ? (
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t('detail.addMedicalRecord')}
                      leftIcon="medkit-outline"
                      onPress={() =>
                        router.push(Routes.orgAnimalMedicalRecordCreate(orgId, animal.id))
                      }
                    />
                  </View>
                ) : null}
                {can.createVaccination ? (
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t('detail.addVaccination')}
                      variant="outline"
                      leftIcon="shield-checkmark-outline"
                      onPress={() =>
                        router.push(Routes.orgAnimalVaccinationCreate(orgId, animal.id))
                      }
                    />
                  </View>
                ) : null}
              </Row>
            </Section>
          ) : null}

          {/* --- Overview: animal information ------------------------- */}
          <Section spacing="xl">
            <Label>{t('detail.overview')}</Label>
            <AnimalInfoCard animal={animal} />
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

          {/* --- Medical modules ---------------------------------------- */}
          {can.viewRecords || can.viewVaccinations || can.viewAppointments ? (
            <Section spacing="xl">
              <Label>{t('detail.medicalSection')}</Label>
              <View style={{ rowGap: theme.spacing.sm }}>
                {can.viewRecords ? (
                  <>
                    <NavRow
                      icon="time-outline"
                      label={t('detail.medicalHistory')}
                      onPress={() => router.push(Routes.orgAnimalMedicalHistory(orgId, animal.id))}
                    />
                    <NavRow
                      icon="medkit-outline"
                      label={t('detail.medicalRecords')}
                      onPress={() => router.push(Routes.orgAnimalMedicalRecords(orgId, animal.id))}
                    />
                  </>
                ) : null}
                {can.viewVaccinations ? (
                  <NavRow
                    icon="shield-checkmark-outline"
                    label={t('detail.vaccinations')}
                    onPress={() => router.push(Routes.orgAnimalVaccinations(orgId, animal.id))}
                  />
                ) : null}
                {can.viewAppointments ? (
                  <NavRow
                    icon="calendar-outline"
                    label={t('detail.appointments')}
                    onPress={() => router.push(Routes.clinicDashboardAppointments(orgId))}
                  />
                ) : null}
              </View>
            </Section>
          ) : null}

          {can.revoke && animal.access ? (
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

          <ImageViewer
            visible={viewerOpen}
            images={animal.galleryUrls}
            onClose={() => setViewerOpen(false)}
          />

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
                { animalId: animal.id },
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

function AnimalInfoCard({ animal }: { animal: ClinicAnimalProfile }) {
  const { t } = useTranslation('orgAnimals');
  const { t: tPets } = useTranslation('pets');
  const none = t('detail.noValue');
  const age = petAge(animal.dateOfBirth);
  // Same age wording as the owner's Pet Details screen.
  const ageLabel = age
    ? age.years > 0
      ? age.months > 0
        ? tPets('detail.ageYearsMonths', { years: age.years, months: age.months })
        : tPets('detail.ageYears', { count: age.years })
      : age.months > 0
        ? tPets('detail.ageMonths', { count: age.months })
        : tPets('detail.ageNewborn')
    : animal.ageEstimate
      ? t(`detail.ageEstimate.${animal.ageEstimate}`)
      : none;

  const rows: { label: string; value: string; selectable?: boolean }[] = [
    {
      label: t('detail.fieldSpecies'),
      value: t(`species.${animal.species}`, { defaultValue: animal.species }),
    },
    { label: t('detail.fieldBreed'), value: animal.breed ?? none },
    { label: t('detail.fieldSex'), value: t(`detail.sex.${animal.sex}`) },
    { label: t('detail.fieldAge'), value: ageLabel },
    { label: t('detail.fieldColor'), value: animal.color ?? none },
    { label: t('detail.fieldFeatures'), value: animal.distinguishingFeatures ?? none },
    {
      label: t('detail.fieldAnimalStatus'),
      value: t(`animalStatus.${animal.status}`, { defaultValue: animal.status }),
    },
    {
      label: t('detail.fieldGrantedAt'),
      value: animal.access ? formatDate(animal.access.grantedAt) : none,
    },
    { label: t('detail.fieldAnimalId'), value: animal.id, selectable: true },
  ];

  return (
    <Card variant="outlined">
      {rows.map((row, i) => (
        <View key={row.label}>
          {i > 0 ? <Divider spacing="sm" /> : null}
          <Row justify="space-between" align="center">
            <Caption>{row.label}</Caption>
            <Text
              variant="bodyMedium"
              numberOfLines={row.selectable ? 2 : 1}
              selectable={row.selectable}
              style={{ maxWidth: '60%' }}
            >
              {row.value}
            </Text>
          </Row>
        </View>
      ))}
    </Card>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', rowGap: 2, flex: 1 }}>
      <Text variant="bodyStrong" color="primary" numberOfLines={1}>
        {value}
      </Text>
      <Caption style={{ textAlign: 'center' }}>{label}</Caption>
    </View>
  );
}

function NavRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
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
