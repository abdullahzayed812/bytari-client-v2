import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Linking, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { Advertisement } from '@/features/ads';
import { useAuthStore } from '@/features/auth/store';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { GovernorateFilterRow, MarketOfferCard } from '../components';
import { BIRD_TYPE_ORDER } from '../constants';
import { useDeletePoultryOffer, usePoultryOffers, useTraderStatus } from '../hooks';
import type { BirdType, PoultryOffer } from '../types';

/** Route `/(app)/poultry/market` — سوق الدواجن. */
export default function PoultryMarketScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { isAdmin, isSupervisorOf } = useCapabilities();
  const user = useAuthStore((s) => s.user);
  const trader = useTraderStatus();

  const [birdType, setBirdType] = useState<BirdType | undefined>(undefined);
  const [governorate, setGovernorate] = useState<string | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const q = usePoultryOffers({ birdType, governorate });
  const del = useDeletePoultryOffer();

  const canManage = (offer: PoultryOffer): boolean =>
    offer.traderUserId === user?.id || isAdmin || isSupervisorOf('MARKET');

  const header = (
    <View style={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
      <Section spacing="md">
        <Advertisement placement="POULTRY_MARKET" />
      </Section>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[undefined, ...BIRD_TYPE_ORDER]}
        keyExtractor={(v) => v ?? 'ALL'}
        contentContainerStyle={{ paddingHorizontal: theme.screenPadding, columnGap: theme.spacing.sm }}
        renderItem={({ item }) => (
          <Chip
            label={item ? t(`poultryMarket.birdType.${item}`) : t('poultryMarket.birdType.ALL')}
            selected={birdType === item}
            onPress={() => setBirdType(item)}
          />
        )}
      />
      <GovernorateFilterRow value={governorate} onChange={setGovernorate} />
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('poultryMarket.title')}
        showBack
        right={
          trader.isApproved ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('actions.addOffer')}
              onPress={() => router.push(Routes.poultryMarketCreate)}
            />
          ) : undefined
        }
      />

      {q.isLoading ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          {header}
          <Loading label={t('poultryMarket.title')} />
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          {header}
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.offers}
          keyExtractor={(o) => o.id}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <MarketOfferCard
              title={t(`poultryMarket.birdType.${item.birdType}`)}
              subtitle={item.breed ?? undefined}
              fallbackIcon="egg-outline"
              imageUrl={item.imageUrls[0] ?? null}
              lines={[
                { label: t('poultryMarket.quantityLabel'), value: `${item.quantity} ${t('poultryMarket.unitBird')}` },
                {
                  label: t('poultryMarket.unitPriceLabel'),
                  value: `${item.price} ${t('poultryMarket.currency')}`,
                  accent: true,
                },
                ...(item.ageWeeks != null
                  ? [{ label: t('poultryMarket.ageLabel'), value: `${item.ageWeeks} ${t('poultryMarket.unitWeek')}` }]
                  : []),
              ]}
              locationLabel={[item.governorate, item.district].filter(Boolean).join(' - ')}
              createdAt={item.createdAt}
              canDelete={canManage(item)}
              onPressDetails={() => router.push(Routes.poultryMarketOffer(item.id))}
              onPressCall={() => void Linking.openURL(`tel:${item.phone}`)}
              onPressWhatsapp={() =>
                void Linking.openURL(`https://wa.me/${(item.whatsapp ?? item.phone).replace(/\D/g, '')}`)
              }
              onPressDelete={() => setPendingDelete(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          ListEmptyComponent={
            <EmptyState icon="egg-outline" title={t('poultryMarket.empty')} message={t('poultryMarket.emptyHint')} />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading /> : null}
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching && !q.isFetchingNextPage}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}

      <ConfirmationDialog
        visible={pendingDelete !== null}
        title={t('deleteConfirm.title')}
        message={t('deleteConfirm.body')}
        confirmLabel={t('actions.delete')}
        cancelLabel={tc('actions.cancel')}
        destructive
        loading={del.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          del.mutate(
            { offerId: pendingDelete },
            {
              onSuccess: () => {
                toast.show({ tone: 'success', message: t('poultryMarket.deleteSuccess') });
                setPendingDelete(null);
              },
              onError: (error) => {
                toast.show({ tone: 'danger', message: apiErrorMessage(error) });
                setPendingDelete(null);
              },
            },
          );
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </SafeAreaScreen>
  );
}
