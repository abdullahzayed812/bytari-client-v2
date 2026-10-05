import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/actions';
import { Avatar, Card } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SegmentedControl } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { EngagementStatusBadge, ServiceRequestCard } from '../components';
import { formatVetServiceDate } from '../constants';
import {
  useMyListingRequests,
  useMyServiceRequests,
  useStartEngagementConversation,
} from '../hooks';
import type { ListingRequest } from '../types';

type Tab = 'sent' | 'posted';

/** Two cards per row from this content width up; a single column on very narrow phones. */
const TWO_COLUMN_MIN_WIDTH = 340;
/** On wide (web/tablet) screens the grid is capped so the two cards stay card-sized. */
const MAX_GRID_WIDTH = 960;

/**
 * Route `/(app)/vet-services/my-requests` — the PET OWNER's "طلباتي":
 *  - "طلباتي للأطباء": requests sent to a vet's service listing — the vet,
 *    the request status, and a chat with that vet (`/listing-requests/mine`).
 *  - "طلباتي المنشورة": service requests the owner published — each shows how
 *    many vets responded; opening one lists the vets' offers, each with chat.
 * Everything rides the existing marketplace endpoints + PET_OWNER_VETERINARIAN
 * chat; the backend scopes every list to the caller. Both tabs are a grid of
 * rectangular cards — two per row (one on very narrow phones), capped in width
 * on large web screens.
 */
export default function MyServiceRequestsScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation('vetServices');
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('sent');
  const { width } = useWindowDimensions();
  const columns = width >= TWO_COLUMN_MIN_WIDTH ? 2 : 1;

  const sentQ = useMyListingRequests(undefined, { enabled: tab === 'sent' });
  const postedQ = useMyServiceRequests(undefined, { enabled: tab === 'posted' });
  const startChat = useStartEngagementConversation();

  const chatWith = (lr: ListingRequest) => {
    if (lr.conversationId) {
      router.push(Routes.vetServiceDeal(lr.conversationId));
      return;
    }
    startChat.mutate(
      { kind: 'listing-request', id: lr.id },
      {
        onSuccess: ({ conversationId }) => router.push(Routes.vetServiceDeal(conversationId)),
        onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
      },
    );
  };

  // Rectangular grid tile: status, the service + vet, number/date, and the chat
  // action; tapping the tile opens the request details.
  const renderSent = ({ item: lr }: { item: ListingRequest }) => {
    const vet = lr.listing?.veterinarian;
    const vetName = vet ? `${vet.firstName} ${vet.lastName}` : '';
    return (
      <View style={{ flex: 1 / columns }}>
        <Card
          variant="elevated"
          padding="md"
          accessibilityLabel={lr.listing?.title ?? lr.requestNumber}
          onPress={() => router.push(Routes.vetServiceEngagement('listing-request', lr.id))}
          style={{ flex: 1, borderRadius: theme.radius.md, minHeight: 190 }}
        >
          <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                columnGap: theme.spacing.xs,
              }}
            >
              <Avatar name={vetName || lr.requestNumber} size="avatarSm" />
              <EngagementStatusBadge status={lr.status} />
            </View>
            <Text variant="bodyStrong" numberOfLines={2}>
              {lr.listing?.title ?? lr.requestNumber}
            </Text>
            {vetName ? (
              <Caption color="textSecondary" numberOfLines={1}>
                {t('common.doctorPrefix', { name: vetName })}
              </Caption>
            ) : null}
            <Caption color="textMuted" numberOfLines={1}>
              {lr.requestNumber}
            </Caption>
            <Caption color="textMuted" numberOfLines={1}>
              {formatVetServiceDate(lr.createdAt, i18n.language)}
            </Caption>
            <View style={{ marginTop: 'auto', paddingTop: theme.spacing.xs }}>
              <Button
                label={t('myRequests.chatVet')}
                size="sm"
                variant="primary"
                fullWidth
                leftIcon="chatbubbles-outline"
                loading={startChat.isPending && startChat.variables?.id === lr.id}
                onPress={() => chatWith(lr)}
              />
            </View>
          </View>
        </Card>
      </View>
    );
  };

  const activeQ = tab === 'sent' ? sentQ : postedQ;
  const refresh = (
    <RefreshControl
      refreshing={activeQ.isRefetching && !activeQ.isFetchingNextPage}
      onRefresh={() => void activeQ.refetch()}
      tintColor={theme.colors.primary}
      colors={[theme.colors.primary]}
    />
  );
  const listStyle = {
    padding: theme.screenPadding,
    paddingBottom: theme.spacing.huge,
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_GRID_WIDTH,
    alignSelf: 'center',
  } as const;
  const grid = {
    numColumns: columns,
    // FlatList cannot change `numColumns` on the fly — remount on a breakpoint flip.
    key: `${tab}-${columns}`,
    columnWrapperStyle: columns > 1 ? { columnGap: theme.spacing.md } : undefined,
  };
  const separator = () => <View style={{ height: theme.spacing.md }} />;

  return (
    <SafeAreaScreen>
      <AppHeader title={t('myRequests.title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'sent', label: t('myRequests.tabSent') },
            { value: 'posted', label: t('myRequests.tabPosted') },
          ]}
        />
      </View>

      {activeQ.isPending && activeQ.isFetching ? (
        <Loading fill />
      ) : activeQ.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={activeQ.error} onRetry={() => void activeQ.refetch()} />
        </View>
      ) : tab === 'sent' ? (
        <FlatList
          {...grid}
          data={sentQ.listingRequests}
          keyExtractor={(i) => i.id}
          renderItem={renderSent}
          ItemSeparatorComponent={separator}
          ListEmptyComponent={
            <EmptyState
              icon="clipboard-outline"
              title={t('myRequests.sentEmpty')}
              message={t('myRequests.sentEmptyHint')}
              actionLabel={t('hub.listings.cta')}
              onAction={() => router.push(Routes.vetServiceListings)}
            />
          }
          onEndReached={() => {
            if (sentQ.hasNextPage && !sentQ.isFetchingNextPage) void sentQ.fetchNextPage();
          }}
          refreshControl={refresh}
          contentContainerStyle={listStyle}
        />
      ) : (
        <FlatList
          {...grid}
          data={postedQ.requests}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={{ flex: 1 / columns }}>
              <ServiceRequestCard
                request={item}
                showStatus
                rectangular
                onPress={() => router.push(Routes.vetServiceRequest(item.id))}
                primaryLabel={t('myRequests.viewResponses', { count: item.offerCount ?? 0 })}
                onPrimary={() => router.push(Routes.vetServiceRequest(item.id))}
              />
            </View>
          )}
          ItemSeparatorComponent={separator}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title={t('myRequests.postedEmpty')}
              message={t('myRequests.postedEmptyHint')}
              actionLabel={t('myRequests.postCta')}
              onAction={() => router.push(Routes.vetServiceRequestNew)}
            />
          }
          onEndReached={() => {
            if (postedQ.hasNextPage && !postedQ.isFetchingNextPage) void postedQ.fetchNextPage();
          }}
          refreshControl={refresh}
          contentContainerStyle={listStyle}
        />
      )}
    </SafeAreaScreen>
  );
}
