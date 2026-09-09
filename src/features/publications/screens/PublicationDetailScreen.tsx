import { router, useLocalSearchParams } from 'expo-router';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon, type IconName } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { Heading, Text } from '@/components/typography';
import { ImageCarousel } from '@/features/organizations';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme';
import { formatDate } from '@/utils';

import { KIND_INTERACTION, PUBLICATION_KIND_META, publicationKindFromSlug } from '../constants';
import {
  useAnimalPublication,
  useCreatePublicationInteraction,
  useDeletePublication,
  usePublicPublication,
} from '../hooks';
import type { PublicationKind, PublicPublication } from '../types';

/**
 * `Button` has no color-override seam (by design, so screens don't reinvent
 * the palette) — this screen genuinely needs the kind's own accent
 * (blue/red/violet), reusing the exact tokens the Pets Landing cards already
 * use, so a small local variant mirrors `Button`'s shape with that accent.
 */
function AccentButton({
  label,
  icon,
  accentToken,
  filled,
  loading,
  onPress,
}: {
  label: string;
  icon: IconName;
  accentToken: keyof ColorTokens;
  filled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const accent = theme.colors[accentToken];
  const fg = filled ? theme.colors.onPrimary : accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: loading, busy: loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          minHeight: theme.sizes.controlHeightMd,
          borderRadius: theme.radius.lg,
          borderWidth: 1.5,
          borderColor: accent,
          backgroundColor: filled ? accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          columnGap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        },
        pressed && { opacity: 0.85 },
        loading && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          <Icon name={icon} size="iconSm" color={filled ? 'onPrimary' : accentToken} />
          <Text variant="bodyMedium" style={{ color: fg }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

interface InfoRow {
  icon: IconName;
  label: string;
  value: string;
}

function buildInfoRows(
  pub: PublicPublication,
  kind: PublicationKind,
  t: TFunction<'publications'>,
): InfoRow[] {
  const { animal } = pub;
  const speciesLabel = t(`species.${animal.species}`, { defaultValue: animal.species });
  const sexLabel = t(`sex.${animal.sex}`, { defaultValue: animal.sex });
  const ageLabel = animal.ageEstimate
    ? t(`ageEstimate.${animal.ageEstimate}`)
    : (animal.dateOfBirth ?? t('detail.noValue'));

  if (kind === 'LOST') {
    return [
      { icon: 'male-female-outline', label: t('detail.fieldSex'), value: sexLabel },
      { icon: 'calendar-outline', label: t('detail.fieldAge'), value: ageLabel },
      {
        icon: 'location-outline',
        label: t('detail.fieldLastSeen'),
        value: pub.lostLocationDetail ?? pub.lostDistrict ?? t('detail.noValue'),
      },
      {
        icon: 'map-outline',
        label: t('detail.fieldGovernorate'),
        value: pub.lostGovernorate ?? t('detail.noValue'),
      },
      {
        icon: 'color-palette-outline',
        label: t('detail.fieldColor'),
        value: animal.color ?? t('detail.noValue'),
      },
      {
        icon: 'calendar-outline',
        label: t('detail.fieldLostDate'),
        value: pub.lostDate ? formatDate(pub.lostDate) : t('detail.noValue'),
      },
      { icon: 'call-outline', label: t('detail.fieldContactPhone'), value: pub.contactPhone },
      {
        icon: 'heart-outline',
        label: t('detail.fieldHealthNotes'),
        value: pub.healthNotes ?? t('detail.noValue'),
      },
    ];
  }

  const base: InfoRow[] = [
    {
      icon: 'color-palette-outline',
      label: t('detail.fieldColor'),
      value: animal.color ?? t('detail.noValue'),
    },
    { icon: 'calendar-outline', label: t('detail.fieldAge'), value: ageLabel },
    {
      icon: 'heart-outline',
      label: t('detail.fieldHealthStatus'),
      value: pub.healthStatus ? t(`healthStatus.${pub.healthStatus}`) : t('detail.noValue'),
    },
    { icon: 'male-female-outline', label: t('detail.fieldSex'), value: sexLabel },
    {
      icon: 'shield-checkmark-outline',
      label: t('detail.fieldVaccination'),
      value: pub.vaccinationStatus
        ? t(`vaccinationStatus.${pub.vaccinationStatus}`)
        : t('detail.noValue'),
    },
    {
      icon: 'location-outline',
      label: t('detail.fieldCity'),
      value: pub.city ?? t('detail.noValue'),
    },
    { icon: 'paw-outline', label: t('detail.fieldBreed'), value: animal.breed ?? speciesLabel },
  ];
  if (kind === 'ADOPTION') {
    base.push({
      icon: 'medkit-outline',
      label: t('detail.fieldSterilized'),
      value:
        pub.isSterilized == null
          ? t('detail.noValue')
          : t(pub.isSterilized ? 'form.yes' : 'form.no'),
    });
  }
  return base;
}

/**
 * Shared Lost / Adoption / Mating publication detail screen. One screen, one
 * layout — the kind decides colors, the info-grid fields, and the two bottom
 * actions (report a sighting vs. request adoption/mating). Owner view (from
 * `PetDetailsScreen`, "My Listings") shows the status/rejection reason
 * instead; public view (from the browse list) shows the full listing.
 */
export default function PublicationDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('publications');
  const toast = useToast();
  const {
    petId,
    publicationId,
    kind: kindSlug,
  } = useLocalSearchParams<{ petId?: string; publicationId: string; kind?: string }>();
  const isOwnerView = Boolean(petId);

  const ownerQ = useAnimalPublication(petId, publicationId, { enabled: isOwnerView });
  const publicQ = usePublicPublication(publicationId, { enabled: !isOwnerView });
  const q = isOwnerView ? ownerQ : publicQ;
  const interact = useCreatePublicationInteraction(publicationId ?? '');
  const del = useDeletePublication();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <EmptyState
          icon="help-circle-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('detail.back')}
          onAction={() => router.back()}
        />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }
  if (q.isLoading || !q.data) {
    return (
      <ScrollScreen padded={false}>
        <Loading fill />
      </ScrollScreen>
    );
  }

  // --- owner ("My Listings") view — status + rejection reason, no actions ---
  if (isOwnerView && ownerQ.data) {
    const pub = ownerQ.data;
    return (
      <ScrollScreen>
        <Section spacing="lg">
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: theme.colors.surfaceAccent,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: 4,
              marginBottom: theme.spacing.sm,
            }}
          >
            <Text variant="label">{t(`detail.statusBadge.${pub.status}`)}</Text>
          </View>
          <Text variant="bodyMedium">{t(`detail.ownerStatusLine.${pub.status}`)}</Text>
          {pub.status === 'REJECTED' && pub.rejectionReason ? (
            <View style={{ marginTop: theme.spacing.sm, rowGap: 4 }}>
              <Text variant="caption" color="textSecondary">
                {t('detail.rejectionReason')}
              </Text>
              <Text variant="body" color="danger">
                {pub.rejectionReason}
              </Text>
            </View>
          ) : null}
        </Section>
        <Section spacing="xl">
          <Card variant="outlined" padding="md">
            <Text variant="bodyMedium">{pub.note}</Text>
          </Card>
        </Section>
        <Section spacing="xl">
          <Button
            label={t('mine.delete')}
            variant="danger"
            fullWidth
            leftIcon="trash-outline"
            loading={del.isPending}
            onPress={() => setConfirmDelete(true)}
          />
        </Section>

        <ConfirmationDialog
          visible={confirmDelete}
          title={t('mine.deleteTitle')}
          message={t('mine.deleteBody')}
          confirmLabel={t('mine.deleteConfirm')}
          destructive
          loading={del.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() =>
            del.mutate(
              { publicationId: pub.id, kind: pub.kind, animalId: pub.animalId },
              {
                onSuccess: () => {
                  setConfirmDelete(false);
                  toast.show({ tone: 'success', message: t('mine.deleteSuccess') });
                  router.back();
                },
                onError: (error) => {
                  setConfirmDelete(false);
                  toast.show({ tone: 'danger', message: apiErrorMessage(error) });
                },
              },
            )
          }
        />
      </ScrollScreen>
    );
  }

  // --- public view ---
  const pub = publicQ.data as PublicPublication;
  const kind = publicationKindFromSlug(kindSlug) ?? pub.kind;
  const meta = PUBLICATION_KIND_META[kind];
  const accent = theme.colors[meta.accent];
  const rows = buildInfoRows(pub, kind, t);
  const interactionType = KIND_INTERACTION[kind];

  const onContactOwner = () => void Linking.openURL(`tel:${pub.contactPhone}`);
  const onInteract = () => {
    if (!interactionType) return;
    interact.mutate(
      { type: interactionType },
      {
        onSuccess: () =>
          toast.show({
            message: t(`detail.interactionSuccess.${interactionType}`),
            tone: 'success',
          }),
        onError: (error) => toast.show({ message: apiErrorMessage(error), tone: 'danger' }),
      },
    );
  };

  return (
    <ScrollScreen padded={false}>
      <View>
        <ImageCarousel images={pub.animal.galleryUrls} />
        <View
          style={{
            position: 'absolute',
            top: theme.spacing.md,
            insetInlineEnd: theme.spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 4,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
            ...theme.shadows.xs,
          }}
        >
          <Icon name={meta.icon} size="iconXs" color={meta.accent} />
          <Text variant="label" style={{ color: accent }}>
            {t(`card.badge.${kind}`)}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
        <Section spacing="lg">
          <Heading level={2} style={{ color: accent }}>
            {pub.animal.name}
          </Heading>
          <Text variant="body" color="textSecondary">
            {pub.animal.breed ??
              t(`species.${pub.animal.species}`, { defaultValue: pub.animal.species })}
          </Text>
          {pub.note ? (
            <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
              {pub.note}
            </Text>
          ) : null}
        </Section>

        <Section spacing="lg">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -theme.spacing.xs }}>
            {rows.map((row) => (
              <View key={row.label} style={{ width: '50%', padding: theme.spacing.xs }}>
                <View
                  style={{
                    borderWidth: 1.5,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.lg,
                    padding: theme.spacing.md,
                    rowGap: 4,
                  }}
                >
                  <Row justify="space-between">
                    <Text variant="caption" color="textSecondary">
                      {row.label}
                    </Text>
                    <Icon name={row.icon} size="iconXs" color={meta.accent} />
                  </Row>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        {pub.extraNotes ? (
          <Section spacing="lg">
            <Card variant="outlined" padding="md">
              <Row gap="xs" justify="space-between">
                <Text variant="bodyStrong">{t('detail.notesTitle')}</Text>
                <Icon name="document-text-outline" size="iconSm" color={meta.accent} />
              </Row>
              <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
                {pub.extraNotes}
              </Text>
            </Card>
          </Section>
        ) : null}

        <Section spacing="huge">
          <Card variant="outlined" padding="md">
            <Row gap="xs" justify="space-between">
              <Text variant="bodyStrong">{t('detail.contactTitle')}</Text>
              <Icon name="call-outline" size="iconSm" color={meta.accent} />
            </Row>
            <View style={{ marginTop: theme.spacing.sm, rowGap: 6 }}>
              <Row justify="space-between">
                <Text variant="caption" color="textSecondary">
                  {t('detail.fieldContactName')}
                </Text>
                <Text variant="bodyMedium">{pub.contactName}</Text>
              </Row>
              <Row justify="space-between">
                <Text variant="caption" color="textSecondary">
                  {t('detail.fieldContactPhone')}
                </Text>
                <Text variant="bodyMedium">{pub.contactPhone}</Text>
              </Row>
              {pub.city ? (
                <Row justify="space-between">
                  <Text variant="caption" color="textSecondary">
                    {t('detail.fieldCity')}
                  </Text>
                  <Text variant="bodyMedium">{pub.city}</Text>
                </Row>
              ) : null}
            </View>
          </Card>
        </Section>

        <Section spacing="huge">
          <Row gap="md">
            <AccentButton
              label={t(`detail.action.${kind}`)}
              icon={interactionType === 'SIGHTING' ? 'alert-circle-outline' : meta.icon}
              accentToken={meta.accent}
              filled={kind !== 'LOST'}
              loading={interact.isPending}
              onPress={onInteract}
            />
            <AccentButton
              label={t('detail.contactOwner')}
              icon="call"
              accentToken={meta.accent}
              filled={kind === 'LOST'}
              onPress={onContactOwner}
            />
          </Row>
        </Section>
      </View>
    </ScrollScreen>
  );
}
