import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Card, Divider, Icon, type IconName } from '@/components/content';
import { EmptyState, ErrorState, SkeletonText } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { ImageViewer, QrCode } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
// Deep import (not the barrel) — keeps animals ↔ clinicDashboard acyclic.
import { useClinicPermissions } from '@/features/clinicDashboard/hooks';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { PetImage, petAge } from '@/features/pets';
import { formatPetCode } from '@/features/pets/petCode';
import { useCapabilities } from '@/hooks';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { ClinicOwnerCard } from '../components/ClinicOwnerCard';
import { ANIMAL_STATUS_TONE } from '../constants';
import { useClinicAnimalProfile } from '../hooks';
import type { ClinicAnimalProfile } from '../types';

/**
 * Route `/organizations/[organizationId]/animals/[animalId]` — the clinic's
 * "pet details" (migrated from the legacy `bytari` `(tabs)/pet-details`
 * clinic mode).
 *
 * Reads `GET /organizations/:id/animals/:animalId` — the clinic-visible
 * profile. There is no clinic ↔ pet link: the stats, and every medical list
 * linked from here, cover ONLY this clinic's own records — another clinic's
 * work is never shown. Action visibility comes from the backend-computed
 * clinic permissions (falling back to the `myRole` heuristic until they load).
 */
export default function OrganizationAnimalDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
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
    viewAppointments: perms?.canViewAppointments ?? false,
    manageAppointments: perms?.canManageAppointments ?? false,
  };
  const createRecord = (type?: 'FULL_EXAM' | 'LAB' | 'FILE') => {
    const path = Routes.orgAnimalMedicalRecordCreate(orgId, animalId ?? '');
    if (type) router.push({ pathname: path as never, params: { type } });
    else router.push(path);
  };
  const recordsView = (view: 'lab' | 'files' | 'notes') =>
    router.push({
      pathname: Routes.orgAnimalMedicalRecords(orgId, animalId ?? '') as never,
      params: { view },
    });

  const q = useClinicAnimalProfile(orgId, animalId);
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

          {/* --- Clinic actions (legacy مراجعة سريعة / فحص كامل / إضافة …) --- */}
          {isActiveAnimal &&
          (can.createRecord || can.createVaccination || can.manageAppointments) ? (
            <Section spacing="lg">
              <Label>{t('detail.actionsSection')}</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {can.createRecord ? (
                  <>
                    <ActionButton
                      icon="flash-outline"
                      label={t('detail.quickReview')}
                      onPress={() =>
                        router.push({
                          pathname: Routes.clinicQuickReview(orgId) as never,
                          params: { animalId: animal.id },
                        })
                      }
                    />
                    <ActionButton
                      icon="clipboard-outline"
                      label={t('detail.fullExam')}
                      onPress={() => createRecord('FULL_EXAM')}
                    />
                    <ActionButton
                      icon="medkit-outline"
                      label={t('detail.addMedicalRecord')}
                      onPress={() => createRecord()}
                    />
                  </>
                ) : null}
                {can.createVaccination ? (
                  <ActionButton
                    icon="shield-checkmark-outline"
                    label={t('detail.addVaccination')}
                    onPress={() => router.push(Routes.orgAnimalVaccinationCreate(orgId, animal.id))}
                  />
                ) : null}
                {can.createRecord ? (
                  <>
                    <ActionButton
                      icon="notifications-outline"
                      label={t('detail.addReminder')}
                      onPress={() => router.push(Routes.orgAnimalReminderCreate(orgId, animal.id))}
                    />
                    <ActionButton
                      icon="flask-outline"
                      label={t('detail.addLab')}
                      onPress={() => createRecord('LAB')}
                    />
                    <ActionButton
                      icon="folder-outline"
                      label={t('detail.addFile')}
                      onPress={() => createRecord('FILE')}
                    />
                  </>
                ) : null}
                {can.manageAppointments ? (
                  <ActionButton
                    icon="calendar-outline"
                    label={t('detail.bookAppointment')}
                    onPress={() =>
                      router.push({
                        pathname: Routes.clinicDashboardAppointmentNew(orgId) as never,
                        params: { animalId: animal.id },
                      })
                    }
                  />
                ) : null}
              </View>
            </Section>
          ) : null}

          {/* --- Owner (legacy "صاحب الحيوان" + محادثة المالك) ---------------- */}
          <Section spacing="xl">
            <Label>{t('detail.ownerSection')}</Label>
            {animal.owner ? (
              <ClinicOwnerCard organizationId={orgId} owner={animal.owner} />
            ) : (
              <Card variant="outlined" padding="md">
                <Row gap="md">
                  <Icon name="person-outline" size="iconMd" color="textMuted" />
                  <Text variant="bodyMedium" color="textSecondary" style={{ flex: 1 }}>
                    {t('detail.ownerUnknown')}
                  </Text>
                </Row>
              </Card>
            )}
          </Section>

          {/* --- Overview: animal information ------------------------- */}
          <Section spacing="xl">
            <Label>{t('detail.overview')}</Label>
            <AnimalInfoCard animal={animal} />
            <Caption style={{ marginTop: theme.spacing.xs }}>{t('detail.fieldsNote')}</Caption>
          </Section>

          {/* --- Animal ID + scannable code (legacy barcode) ------------- */}
          <Section spacing="xl">
            <Label>{t('detail.idSection')}</Label>
            <Card variant="outlined" padding="md">
              <View style={{ alignItems: 'center', rowGap: theme.spacing.sm }}>
                <QrCode
                  value={animal.publicCode}
                  size={140}
                  accessibilityLabel={t('detail.idSection')}
                />
                <Text variant="title" weight="bold" selectable style={{ letterSpacing: 2 }}>
                  {formatPetCode(animal.publicCode)}
                </Text>
                <Caption style={{ textAlign: 'center' }}>{t('detail.idHint')}</Caption>
              </View>
            </Card>
          </Section>

          {/* --- Medical modules (legacy clinic tabs) -------------------- */}
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
                {can.viewRecords ? (
                  <>
                    <NavRow
                      icon="notifications-outline"
                      label={t('detail.reminders')}
                      onPress={() => router.push(Routes.orgAnimalReminders(orgId, animal.id))}
                    />
                    <NavRow
                      icon="flask-outline"
                      label={t('detail.lab')}
                      onPress={() => recordsView('lab')}
                    />
                    <NavRow
                      icon="folder-outline"
                      label={t('detail.files')}
                      onPress={() => recordsView('files')}
                    />
                    <NavRow
                      icon="document-text-outline"
                      label={t('detail.notes')}
                      onPress={() => recordsView('notes')}
                    />
                  </>
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

          <ImageViewer
            visible={viewerOpen}
            images={animal.galleryUrls}
            onClose={() => setViewerOpen(false)}
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
    {
      label: t('detail.fieldWeight'),
      value: animal.weightKg !== null ? t('detail.weightValue', { value: animal.weightKg }) : none,
    },
    {
      label: t('detail.fieldNeutered'),
      value:
        animal.isNeutered === null
          ? none
          : animal.isNeutered
            ? t('detail.neutered')
            : t('detail.notNeutered'),
    },
    { label: t('detail.fieldFeatures'), value: animal.distinguishingFeatures ?? none },
    {
      label: t('detail.fieldAnimalStatus'),
      value: t(`animalStatus.${animal.status}`, { defaultValue: animal.status }),
    },
    {
      label: t('detail.fieldFirstRecord'),
      value: animal.relationship ? formatDate(animal.relationship.firstActivityAt) : none,
    },
    {
      label: t('detail.fieldAnimalId'),
      value: formatPetCode(animal.publicCode),
      selectable: true,
    },
    ...(animal.medicalHistory
      ? [{ label: t('detail.fieldMedicalHistory'), value: animal.medicalHistory, selectable: true }]
      : []),
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
              numberOfLines={row.selectable ? 6 : 1}
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

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      padding="sm"
      onPress={onPress}
      accessibilityLabel={label}
      style={{ flexGrow: 1, minWidth: '30%' }}
    >
      <View style={{ alignItems: 'center', rowGap: theme.spacing.xs }}>
        <Icon name={icon} size="iconMd" color="primary" />
        <Text variant="label" style={{ textAlign: 'center' }}>
          {label}
        </Text>
      </View>
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
