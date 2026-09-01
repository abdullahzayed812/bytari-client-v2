import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Divider, Icon } from '@/components/content';
import { EmptyState, ErrorState, SkeletonText } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { PublicationKindBadge, PublicationStatusBadge } from '../components';
import { publicationKindFromSlug, publicationSpeciesIcon } from '../constants';
import { useAnimalPublication, usePublicPublication } from '../hooks';

/**
 * Publication detail — two perspectives from one screen (§23):
 *  - OWNER  `/pets/[petId]/publications/[publicationId]` — status + rejection
 *    reason + approval visibility; the animal is the caller's own pet.
 *  - PUBLIC `/publications/[kind]/[publicationId]` — the APPROVED public
 *    projection: animal name / species / breed + note + published date. No
 *    owner identity, no contact details (the backend exposes none).
 */
export default function PublicationDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('publications');
  const {
    petId,
    publicationId,
    kind: kindSlug,
  } = useLocalSearchParams<{
    petId?: string;
    publicationId: string;
    kind?: string;
  }>();
  const isOwnerView = Boolean(petId);

  const ownerQ = useAnimalPublication(petId, publicationId, { enabled: isOwnerView });
  const publicQ = usePublicPublication(publicationId, { enabled: !isOwnerView });
  const q = isOwnerView ? ownerQ : publicQ;

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
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
        <AppHeader title={t('detail.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  if (q.isLoading || !q.data) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <Section spacing="xl">
          <SkeletonText lines={5} />
        </Section>
      </ScrollScreen>
    );
  }

  if (isOwnerView && ownerQ.data) {
    const pub = ownerQ.data;
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />

        <Section spacing="lg">
          <Row gap="xs" wrap align="center">
            <PublicationKindBadge kind={pub.kind} size="md" />
            <PublicationStatusBadge status={pub.status} size="md" />
          </Row>
        </Section>

        <Section spacing="xl">
          <Card variant="outlined" padding="md">
            <Text variant="bodyMedium">{t(`detail.ownerStatusLine.${pub.status}`)}</Text>
            {pub.status === 'REJECTED' && pub.rejectionReason ? (
              <View style={{ marginTop: theme.spacing.sm, rowGap: 4 }}>
                <Caption>{t('detail.rejectionReason')}</Caption>
                <Text variant="body" color="danger">
                  {pub.rejectionReason}
                </Text>
              </View>
            ) : null}
          </Card>
        </Section>

        <Section spacing="xl">
          <Label>{t('detail.sectionListing')}</Label>
          <Card variant="outlined">
            <Field label={t('detail.fieldKind')} value={t(`kind.${pub.kind}`)} />
            <Divider spacing="sm" />
            <Field label={t('detail.fieldSubmittedAt')} value={formatDate(pub.createdAt)} />
            {pub.reviewedAt ? (
              <>
                <Divider spacing="sm" />
                <Field label={t('detail.fieldReviewedAt')} value={formatDate(pub.reviewedAt)} />
              </>
            ) : null}
            {pub.note ? (
              <>
                <Divider spacing="sm" />
                <View style={{ rowGap: 4 }}>
                  <Caption>{t('detail.fieldNote')}</Caption>
                  <Text variant="body">{pub.note}</Text>
                </View>
              </>
            ) : null}
          </Card>
        </Section>
      </ScrollScreen>
    );
  }

  // --- public view ---
  const pub = publicQ.data!;
  const kind = publicationKindFromSlug(kindSlug) ?? pub.kind;
  return (
    <ScrollScreen>
      <AppHeader title={t('detail.title')} showBack />

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
            <Icon name={publicationSpeciesIcon(pub.animal.species)} size="iconLg" color="primary" />
          </View>
          <View style={{ flex: 1, rowGap: 4 }}>
            <Heading level={2} numberOfLines={1}>
              {pub.animal.name}
            </Heading>
            <Row gap="xs" wrap>
              <PublicationKindBadge kind={kind} size="sm" />
              <Caption>{formatDate(pub.publishedAt)}</Caption>
            </Row>
          </View>
        </Row>
      </Section>

      <Section spacing="xl">
        <Label>{t('detail.sectionAnimal')}</Label>
        <Card variant="outlined">
          <Field
            label={t('detail.fieldSpecies')}
            value={t(`species.${pub.animal.species}`, { defaultValue: pub.animal.species })}
          />
          <Divider spacing="sm" />
          <Field label={t('detail.fieldBreed')} value={pub.animal.breed ?? t('detail.noValue')} />
        </Card>
      </Section>

      {pub.note ? (
        <Section spacing="xl">
          <Label>{t('detail.fieldNote')}</Label>
          <Card variant="outlined" padding="md">
            <Text variant="body">{pub.note}</Text>
          </Card>
        </Section>
      ) : null}

      <Section spacing="xl">
        <Card variant="outlined" padding="md">
          <Row gap="md">
            <Icon name="lock-closed-outline" size="iconMd" color="textMuted" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" color="textSecondary">
                {t('detail.contactHiddenTitle')}
              </Text>
              <Caption>{t('detail.contactHiddenBody')}</Caption>
            </View>
          </Row>
        </Card>
      </Section>
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
