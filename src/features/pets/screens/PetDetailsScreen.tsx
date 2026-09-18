import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Divider, Icon, type IconName } from '@/components/content';
import { EmptyState, ErrorState, SkeletonText } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { PublicationKindBadge, PublicationStatusBadge } from '@/features/publications/components';
import { PUBLICATION_KIND_META } from '@/features/publications/constants';
import { useAnimalPublications } from '@/features/publications/hooks';
import { UserName } from '@/features/users/components';
import { useAuth } from '@/hooks';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { FutureSectionRow, PetImage } from '../components';
import { petAge } from '../constants';
import { usePet } from '../hooks';

/** Route `/pets/[petId]` — pet profile (§6). No medical data yet; future slots only. */
export default function PetDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const { t: tp } = useTranslation('publications');
  const { user } = useAuth();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const q = usePet(petId);
  const pet = q.data;
  const isOwner = Boolean(pet && user && pet.currentOwnerUserId === user.id);
  const canPublish = isOwner && pet?.status === 'ACTIVE';
  const listings = useAnimalPublications(petId, { enabled: canPublish });

  const notFound = q.error instanceof ApiError && q.error.status === 404;

  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon="help-circle-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('detail.backToList')}
          onAction={() => router.replace(Routes.pets)}
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

  const age = pet ? petAge(pet.dateOfBirth) : null;
  const ageLabel = age
    ? age.years > 0
      ? age.months > 0
        ? t('detail.ageYearsMonths', { years: age.years, months: age.months })
        : t('detail.ageYears', { count: age.years })
      : age.months > 0
        ? t('detail.ageMonths', { count: age.months })
        : t('detail.ageNewborn')
    : t('detail.noValue');

  return (
    <ScrollScreen>
      <AppHeader title={t('detail.title')} showBack />

      {q.isLoading || !pet ? (
        <Section spacing="xl">
          <Row gap="lg">
            <PetImage uri={null} species="OTHER" size={88} />
            <View style={{ flex: 1 }}>
              <SkeletonText lines={2} />
            </View>
          </Row>
          <View style={{ marginTop: theme.spacing.xl }}>
            <SkeletonText lines={5} />
          </View>
        </Section>
      ) : (
        <>
          <Section spacing="xl">
            <Row gap="lg" align="center">
              <PetImage uri={pet.galleryUrls?.[0] ?? null} species={pet.species} size={88} rounded="xl" />
              <View style={{ flex: 1, rowGap: 4 }}>
                <Heading level={2} numberOfLines={1}>
                  {pet.name}
                </Heading>
                <Row gap="xs" wrap>
                  <Badge label={t(`species.${pet.species}`)} tone="primary" size="sm" />
                  {pet.status === 'DEACTIVATED' ? (
                    <Badge label={t('status.DEACTIVATED')} tone="neutral" size="sm" />
                  ) : null}
                  {isOwner ? <Badge label={t('detail.ownerYou')} tone="success" size="sm" /> : null}
                </Row>
              </View>
            </Row>
          </Section>

          <Section spacing="xl">
            <Label>{t('detail.sectionInfo')}</Label>
            <Card variant="outlined">
              <InfoRow label={t('detail.fieldSpecies')} value={t(`species.${pet.species}`)} />
              <Divider spacing="sm" />
              <InfoRow label={t('detail.fieldBreed')} value={pet.breed ?? t('detail.noValue')} />
              <Divider spacing="sm" />
              <InfoRow label={t('detail.fieldSex')} value={t(`sex.${pet.sex}`)} />
              <Divider spacing="sm" />
              <InfoRow
                label={t('detail.fieldDob')}
                value={pet.dateOfBirth ?? t('detail.noValue')}
              />
              <Divider spacing="sm" />
              <InfoRow label={t('detail.fieldAge')} value={ageLabel} />
              {pet.notes ? (
                <>
                  <Divider spacing="sm" />
                  <View style={{ rowGap: 4 }}>
                    <Caption>{t('detail.fieldNotes')}</Caption>
                    <Text variant="body">{pet.notes}</Text>
                  </View>
                </>
              ) : null}
            </Card>
          </Section>

          <Section spacing="xl">
            <Label>{t('detail.ownershipSection')}</Label>
            <Card variant="outlined">
              <Row justify="space-between" align="center">
                <Caption>{t('detail.ownerLabel')}</Caption>
                {isOwner ? (
                  <Text variant="bodyMedium">{t('detail.ownerYou')}</Text>
                ) : (
                  <UserName
                    userId={pet.currentOwnerUserId}
                    variant="bodyMedium"
                    numberOfLines={1}
                    style={{ maxWidth: '60%' }}
                  />
                )}
              </Row>
            </Card>
            <View style={{ marginTop: theme.spacing.sm, rowGap: theme.spacing.sm }}>
              <MedicalNavRow
                icon="people-outline"
                label={t('detail.ownershipHistory')}
                onPress={() => router.push(Routes.petOwnership(pet.id))}
              />
              {isOwner && pet.status === 'ACTIVE' ? (
                <Button
                  label={t('detail.transferOwnership')}
                  variant="outline"
                  leftIcon="swap-horizontal-outline"
                  onPress={() =>
                    router.push({
                      pathname: Routes.petTransferRequests,
                      params: { petId: pet.id },
                    })
                  }
                />
              ) : null}
            </View>
          </Section>

          <Section spacing="xl">
            <Label>{t('detail.futureSections')}</Label>
            <View style={{ rowGap: theme.spacing.sm }}>
              {isOwner ? (
                <>
                  <MedicalNavRow
                    icon="time-outline"
                    label={t('detail.medicalHistory')}
                    onPress={() => router.push(Routes.petMedicalHistory(pet.id))}
                  />
                  <MedicalNavRow
                    icon="medkit-outline"
                    label={t('detail.medicalRecords')}
                    onPress={() => router.push(Routes.petMedicalRecords(pet.id))}
                  />
                  <MedicalNavRow
                    icon="shield-checkmark-outline"
                    label={t('detail.vaccinations')}
                    onPress={() => router.push(Routes.petVaccinations(pet.id))}
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
            </View>
          </Section>

          {/* --- Animal community: publish + this pet's listings (Phase 8) --- */}
          {canPublish ? (
            <Section spacing="xl">
              <Label>{tp('detail.communityTitle')}</Label>
              <View style={{ rowGap: theme.spacing.sm }}>
                {(['ADOPTION', 'MATING', 'LOST'] as const).map((k) => (
                  <MedicalNavRow
                    key={k}
                    icon={PUBLICATION_KIND_META[k].icon}
                    label={tp(`detail.publishAction.${k}`)}
                    onPress={() =>
                      router.push(Routes.petPublish(pet.id, PUBLICATION_KIND_META[k].slug))
                    }
                  />
                ))}
              </View>

              {listings.publications.length > 0 ? (
                <View style={{ marginTop: theme.spacing.md, rowGap: theme.spacing.sm }}>
                  <Caption>{tp('detail.listingsTitle')}</Caption>
                  {listings.publications.map((pub) => (
                    <Card
                      key={pub.id}
                      variant="outlined"
                      padding="md"
                      onPress={() => router.push(Routes.petPublication(pet.id, pub.id))}
                      accessibilityLabel={tp('detail.listingRow', {
                        kind: tp(`detail.publishAction.${pub.kind}`),
                      })}
                    >
                      <Row gap="sm" wrap align="center">
                        <PublicationKindBadge kind={pub.kind} />
                        <PublicationStatusBadge status={pub.status} />
                        <Caption>{formatDate(pub.createdAt)}</Caption>
                      </Row>
                    </Card>
                  ))}
                </View>
              ) : null}
            </Section>
          ) : null}

          {pet.status === 'ACTIVE' ? (
            <Button
              label={t('detail.edit')}
              variant="outline"
              leftIcon="create-outline"
              onPress={() => router.push(Routes.petEdit(pet.id))}
            />
          ) : null}
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

/** Read-only entry into the owner's medical-history views (Phase 6). */
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
