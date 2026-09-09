import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Card } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SegmentedControl } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { ListingRequestCard, OfferCard, ServiceListingCard } from '../components';
import {
  useListingRequestAction,
  useMyOffers,
  useMyServiceListings,
  useReceivedListingRequests,
} from '../hooks';
import type { ListingRequest, ServiceListing, ServiceOffer } from '../types';

type Tab = 'engagements' | 'listings';
type Row =
  | { kind: 'listing'; item: ServiceListing }
  | { kind: 'received'; item: ListingRequest }
  | { kind: 'offer'; item: ServiceOffer }
  | { kind: 'heading'; id: string; label: string };

/** Route `/(app)/vet-services/my` — vet-only "خدماتي" (screenshot 4). */
export default function MyServicesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetServices');
  const toast = useToast();
  const caps = useCapabilities();
  const [tab, setTab] = useState<Tab>('engagements');

  const listingsQ = useMyServiceListings(undefined, { enabled: caps.isApprovedVeterinarian });
  const receivedQ = useReceivedListingRequests(undefined, { enabled: caps.isApprovedVeterinarian });
  const offersQ = useMyOffers(undefined, { enabled: caps.isApprovedVeterinarian });
  const lrAction = useListingRequestAction();

  if (!caps.isApprovedVeterinarian) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('my.title')} showBack />
        <EmptyState icon="lock-closed-outline" title={t('my.vetOnly')} message={t('my.vetOnlyHint')} />
      </SafeAreaScreen>
    );
  }

  const openDeal = (conversationId: string | null) => {
    if (conversationId) router.push(Routes.vetServiceDeal(conversationId));
  };
  const runLr = (id: string, action: 'accept' | 'reject') =>
    lrAction.mutate(
      { id, action },
      {
        onSuccess: () => toast.show({ tone: 'success', message: t(`listingRequest.${action}Done`) }),
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      },
    );

  const rows: Row[] =
    tab === 'listings'
      ? listingsQ.listings.map((item) => ({ kind: 'listing', item }))
      : [
          { kind: 'heading', id: 'h-received', label: t('my.receivedRequests') },
          ...receivedQ.listingRequests.map((item) => ({ kind: 'received' as const, item })),
          { kind: 'heading', id: 'h-offers', label: t('my.myOffers') },
          ...offersQ.offers.map((item) => ({ kind: 'offer' as const, item })),
        ];

  const activeQ = tab === 'listings' ? listingsQ : receivedQ;
  const loading =
    tab === 'listings' ? listingsQ.isLoading : receivedQ.isLoading || offersQ.isLoading;
  const errored = tab === 'listings' ? listingsQ.isError : receivedQ.isError || offersQ.isError;

  const stats =
    tab === 'listings'
      ? [
          { label: t('my.statPublished'), value: listingsQ.total },
        ]
      : [
          { label: t('my.statReceived'), value: receivedQ.total },
          { label: t('my.statOffers'), value: offersQ.total },
        ];

  const header = (
    <View style={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'engagements', label: t('my.tabEngagements') },
          { value: 'listings', label: t('my.tabListings') },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        {stats.map((s) => (
          <Card key={s.label} variant="outlined" padding="md" style={{ flex: 1 }}>
            <Text variant="heading" style={{ color: theme.colors.serviceAccent }}>
              {s.value}
            </Text>
            <Caption color="textSecondary">{s.label}</Caption>
          </Card>
        ))}
      </View>
      {tab === 'listings' ? (
        <Button
          label={t('listings.addCta')}
          variant="primary"
          fullWidth
          leftIcon="add"
          onPress={() => router.push(Routes.vetServiceListingNew)}
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('my.title')}
        showBack
        right={
          <IconButton
            icon="add"
            variant="soft"
            accessibilityLabel={t('listings.addCta')}
            onPress={() => router.push(Routes.vetServiceListingNew)}
          />
        }
      />

      {loading ? (
        <Loading fill label={t('common.loading')} />
      ) : errored ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={activeQ.error} onRetry={() => void activeQ.refetch()} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => (row.kind === 'heading' ? row.id : `${row.kind}-${row.item.id}`)}
          ListHeaderComponent={header}
          renderItem={({ item: row }) => {
            if (row.kind === 'heading') {
              return (
                <Text variant="bodyStrong" style={{ marginTop: theme.spacing.sm }}>
                  {row.label}
                </Text>
              );
            }
            if (row.kind === 'listing') {
              return (
                <ServiceListingCard
                  listing={row.item}
                  showStatus
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/vet-services/listings/[listingId]',
                      params: { listingId: row.item.id, manage: '1' },
                    })
                  }
                />
              );
            }
            if (row.kind === 'received') {
              const lr = row.item;
              return (
                <View style={{ rowGap: theme.spacing.xs }}>
                  <ListingRequestCard
                    listingRequest={lr}
                    busy={lrAction.isPending}
                    onPress={() => router.push(Routes.vetServiceEngagement('listing-request', lr.id))}
                    onAccept={() => runLr(lr.id, 'accept')}
                    onReject={() => runLr(lr.id, 'reject')}
                  />
                  {lr.status === 'ACCEPTED' && lr.conversationId ? (
                    <Button
                      label={t('actions.openConversation')}
                      variant="ghost"
                      size="sm"
                      leftIcon="chatbubbles-outline"
                      onPress={() => openDeal(lr.conversationId)}
                    />
                  ) : null}
                </View>
              );
            }
            const o = row.item;
            return (
              <View style={{ rowGap: theme.spacing.xs }}>
                <OfferCard
                  offer={o}
                  onPress={() => router.push(Routes.vetServiceEngagement('offer', o.id))}
                />
                {o.status === 'ACCEPTED' && o.conversationId ? (
                  <Button
                    label={t('actions.openConversation')}
                    variant="ghost"
                    size="sm"
                    leftIcon="chatbubbles-outline"
                    onPress={() => openDeal(o.conversationId)}
                  />
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title={tab === 'listings' ? t('my.listingsEmpty') : t('my.engagementsEmpty')}
              message={tab === 'listings' ? t('my.listingsEmptyHint') : t('my.engagementsEmptyHint')}
            />
          }
          contentContainerStyle={{
            padding: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={activeQ.isRefetching}
              onRefresh={() => {
                void listingsQ.refetch();
                void receivedQ.refetch();
                void offersQ.refetch();
              }}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </SafeAreaScreen>
  );
}
