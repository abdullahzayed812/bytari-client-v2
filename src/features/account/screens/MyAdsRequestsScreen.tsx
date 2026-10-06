import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Icon, type BadgeTone, type IconName } from '@/components/content';
import { EmptyState, Loading } from '@/components/feedback';
import { SegmentedControl } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import {
  publicationKindSlug,
  useMyPublicationInteractions,
  useMyPublications,
} from '@/features/publications';
import { useMyVetJobApplications, useMyVetJobOffers } from '@/features/vetJobs/hooks';
import {
  useMyListingRequests,
  useMyOffers,
  useMyServiceListings,
  useMyServiceRequests,
} from '@/features/vetServices/hooks';
import { useAppMode } from '@/hooks';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

type Tab = 'ads' | 'requests';
type Section = 'SERVICES' | 'JOBS' | 'PUBLICATIONS';
type State = 'active' | 'ended' | 'review' | 'rejected';

interface Row {
  key: string;
  section: Section;
  title: string;
  createdAt: string;
  imageUrl: string | null;
  state: State;
  href: Href;
}

const STATE_TONE: Record<State, BadgeTone> = {
  active: 'success',
  ended: 'neutral',
  review: 'warning',
  rejected: 'danger',
};

const SECTION_ICON: Record<Section, IconName> = {
  SERVICES: 'medkit-outline',
  JOBS: 'briefcase-outline',
  PUBLICATIONS: 'paw-outline',
};

/** PENDING / APPROVED / REJECTED (+ closed) → the four reference states. */
function moderationState(status: string, closedAt?: string | null): State {
  if (status === 'REJECTED') return 'rejected';
  if (status === 'PENDING') return 'review';
  return closedAt ? 'ended' : 'active';
}

/** Engagement / application lifecycle → the four reference states. */
function engagementState(status: string): State {
  switch (status) {
    case 'PENDING':
      return 'review';
    case 'ACCEPTED':
      return 'active';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'ended'; // COMPLETED / CANCELLED
  }
}

/**
 * Route `/(app)/profile/ads` — "إعلاناتي وطلباتي" (reference design). One
 * read-only overview over the caller's EXISTING "mine" endpoints (no new
 * backend), scoped to the active interface:
 *  - Veterinarian — ads: own service listings + job offers; requests: own
 *    offers on owners' service requests + job applications.
 *  - Pet Owner — ads: own published service requests + animal publications;
 *    requests: requests sent to vets' service listings.
 *  - Both — requests also list my adoption / mating requests and lost-animal
 *    sighting reports (`GET /animal-publications/interactions/mine`).
 * Each row opens that item's existing screen.
 */
export default function MyAdsRequestsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('profile');
  const { isVeterinarianMode: vet } = useAppMode();
  const [tab, setTab] = useState<Tab>('ads');
  const ads = tab === 'ads';
  const owner = !vet;

  // vet sources
  const listings = useMyServiceListings(undefined, { enabled: vet && ads });
  const jobOffers = useMyVetJobOffers(undefined, { enabled: vet && ads });
  const offers = useMyOffers(undefined, { enabled: vet && !ads });
  const applications = useMyVetJobApplications(undefined, { enabled: vet && !ads });
  // owner sources
  const serviceRequests = useMyServiceRequests(undefined, { enabled: owner && ads });
  const adoption = useMyPublications('ADOPTION', { enabled: owner && ads });
  const mating = useMyPublications('MATING', { enabled: owner && ads });
  const lost = useMyPublications('LOST', { enabled: owner && ads });
  const listingRequests = useMyListingRequests(undefined, { enabled: owner && !ads });
  // both interfaces: my adoption / mating requests + lost-animal sighting reports
  const animalRequests = useMyPublicationInteractions({ enabled: !ads });

  const active = vet
    ? ads
      ? [listings, jobOffers]
      : [offers, applications, animalRequests]
    : ads
      ? [serviceRequests, adoption, mating, lost]
      : [listingRequests, animalRequests];
  const loading = active.some((q) => q.isLoading);
  const refetching = active.some((q) => q.isRefetching);
  const refresh = () => active.forEach((q) => void q.refetch());

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    if (vet && ads) {
      for (const l of listings.listings) {
        out.push({
          key: `l:${l.id}`,
          section: 'SERVICES',
          title: l.title,
          createdAt: l.createdAt,
          imageUrl: l.imageUrls[0] ?? null,
          state: moderationState(l.status, l.closedAt),
          href: {
            pathname: '/(app)/vet-services/listings/[listingId]',
            params: { listingId: l.id, manage: '1' },
          },
        });
      }
      for (const o of jobOffers.offers) {
        out.push({
          key: `j:${o.id}`,
          section: 'JOBS',
          title: o.title,
          createdAt: o.createdAt,
          imageUrl: null,
          state: moderationState(o.status, o.closedAt),
          href: Routes.vetJobOfferApplicants(o.id),
        });
      }
    } else if (vet) {
      for (const o of offers.offers) {
        out.push({
          key: `o:${o.id}`,
          section: 'SERVICES',
          title: o.request?.title ?? '—',
          createdAt: o.createdAt,
          imageUrl: o.imageUrls[0] ?? null,
          state: engagementState(o.status),
          href: Routes.vetServiceEngagement('offer', o.id),
        });
      }
      for (const a of applications.applications) {
        out.push({
          key: `a:${a.id}`,
          section: 'JOBS',
          title: a.offer?.title ?? '—',
          createdAt: a.createdAt,
          imageUrl: a.photoUrl,
          state: engagementState(a.status),
          href: a.offer ? Routes.vetJobOffer(a.offer.id) : Routes.vetJobMy,
        });
      }
    } else if (ads) {
      for (const r of serviceRequests.requests) {
        out.push({
          key: `r:${r.id}`,
          section: 'SERVICES',
          title: r.title,
          createdAt: r.createdAt,
          imageUrl: r.imageUrls[0] ?? null,
          state: moderationState(r.status, r.closedAt),
          href: Routes.vetServiceRequest(r.id),
        });
      }
      for (const p of [...adoption.publications, ...mating.publications, ...lost.publications]) {
        out.push({
          key: `p:${p.id}`,
          section: 'PUBLICATIONS',
          title: p.animal.name,
          createdAt: p.createdAt,
          imageUrl: p.animal.galleryUrls[0] ?? null,
          state: moderationState(p.status),
          href: Routes.petPublication(p.animalId, p.id),
        });
      }
    } else {
      for (const lr of listingRequests.listingRequests) {
        out.push({
          key: `lr:${lr.id}`,
          section: 'SERVICES',
          title: lr.listing?.title ?? lr.requestNumber,
          createdAt: lr.createdAt,
          imageUrl: lr.imageUrls[0] ?? null,
          state: engagementState(lr.status),
          href: Routes.vetServiceEngagement('listing-request', lr.id),
        });
      }
    }
    if (!ads) {
      for (const i of animalRequests.interactions) {
        const p = i.publication;
        out.push({
          key: `pi:${i.id}`,
          section: 'PUBLICATIONS',
          title: p.animalName,
          createdAt: i.createdAt,
          imageUrl: null,
          state:
            p.status === 'REJECTED'
              ? 'rejected'
              : p.status !== 'APPROVED'
                ? 'review'
                : p.resolution
                  ? 'ended'
                  : 'active',
          // a resolved listing is locked — continue in the conversation instead
          href:
            p.resolution && i.conversationId
              ? Routes.chatThread(i.conversationId)
              : Routes.publicationDetail(publicationKindSlug(p.kind), p.id),
        });
      }
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [
    vet,
    ads,
    listings.listings,
    jobOffers.offers,
    offers.offers,
    applications.applications,
    serviceRequests.requests,
    adoption.publications,
    mating.publications,
    lost.publications,
    listingRequests.listingRequests,
    animalRequests.interactions,
  ]);

  // "إضافة إعلان جديد": a vet publishes a service; an owner publishes a service request.
  const addHref: Href | null = ads
    ? vet
      ? Routes.vetServiceListingNew
      : Routes.vetServiceRequestNew
    : owner
      ? Routes.vetServiceListings
      : null;
  const addLabel = ads ? t('ads.addNew') : t('ads.newRequest');

  return (
    <SafeAreaScreen>
      <AppHeader title={t('ads.title')} showBack />
      <View
        style={{
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.sm,
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
        }}
      >
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'ads', label: t('ads.tabAds') },
            { value: 'requests', label: t('ads.tabRequests') },
          ]}
        />
      </View>
      {loading ? (
        <Loading fill />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          renderItem={({ item }) => <AdRow row={item} />}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon={ads ? 'megaphone-outline' : 'clipboard-outline'}
              title={ads ? t('ads.emptyAds') : t('ads.emptyRequests')}
            />
          }
          ListFooterComponent={
            addHref ? (
              <View style={{ marginTop: theme.spacing.xl }}>
                <Button
                  label={addLabel}
                  leftIcon="add-circle-outline"
                  fullWidth
                  onPress={() => router.push(addHref)}
                />
              </View>
            ) : null
          }
          contentContainerStyle={{
            padding: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            flexGrow: 1,
            width: '100%',
            maxWidth: 720,
            alignSelf: 'center',
          }}
          refreshControl={
            <RefreshControl
              refreshing={refetching}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </SafeAreaScreen>
  );
}

function AdRow({ row }: { row: Row }) {
  const theme = useTheme();
  const { t } = useTranslation('profile');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.title}
      onPress={() => router.push(row.href)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 96,
          height: 84,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.primarySoft,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {row.imageUrl ? (
          <Image
            source={{ uri: row.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Icon name={SECTION_ICON[row.section]} size="iconLg" color="primary" />
        )}
      </View>
      <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {row.title}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            columnGap: theme.spacing.md,
          }}
        >
          <Caption color="textSecondary">{t(`ads.sections.${row.section}`)}</Caption>
          <Caption color="textSecondary">{formatDate(row.createdAt)}</Caption>
        </View>
      </View>
      <Badge label={t(`ads.status.${row.state}`)} tone={STATE_TONE[row.state]} />
      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
