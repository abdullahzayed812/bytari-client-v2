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
import { EGG_TYPE_ORDER } from '../constants';
import { useDeleteEggOffer, useEggOffers, useMyEggOffers, useTraderStatus } from '../hooks';
import type { EggOffer, EggType } from '../types';

/** Route `/(app)/poultry/egg-market` — سوق البيض. */
export default function EggMarketScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { isAdmin, isSupervisorOf } = useCapabilities();
  const user = useAuthStore((s) => s.user);
  const trader = useTraderStatus();

  const [eggType, setEggType] = useState<EggType | undefined>(undefined);
  const [governorate, setGovernorate] = useState<string | undefined>(undefined);
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const allQ = useEggOffers({ eggType, governorate, enabled: scope === 'all' });
  const mineQ = useMyEggOffers({ enabled: scope === 'mine' && trader.isApproved });
  const q = scope === 'all' ? allQ : mineQ;
  const del = useDeleteEggOffer();

  const canManage = (offer: EggOffer): boolean =>
    offer.traderUserId === user?.id || isAdmin || isSupervisorOf('MARKET');

  const unitLabel = (offer: EggOffer): string =>
    t(`eggMarket.sellUnit.${offer.sellUnit}`);

  const header = (
    <View style={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
      <Section spacing="md">
        <Advertisement placement="EGG_MARKET" />
      </Section>
      {trader.isApproved ? (
        <View
          style={{
            flexDirection: 'row',
            columnGap: theme.spacing.sm,
            paddingHorizontal: theme.screenPadding,
          }}
        >
          <Chip label={t('scope.all')} selected={scope === 'all'} onPress={() => setScope('all')} />
          <Chip
            label={t('scope.mineOffers')}
            selected={scope === 'mine'}
            onPress={() => setScope('mine')}
          />
        </View>
      ) : null}
      {scope === 'all' ? (
        <>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[undefined, ...EGG_TYPE_ORDER]}
            keyExtractor={(v) => v ?? 'ALL'}
            contentContainerStyle={{
              paddingHorizontal: theme.screenPadding,
              columnGap: theme.spacing.sm,
            }}
            renderItem={({ item }) => (
              <Chip
                label={item ? t(`eggMarket.eggType.${item}`) : t('eggMarket.eggType.ALL')}
                selected={eggType === item}
                onPress={() => setEggType(item)}
              />
            )}
          />
          <GovernorateFilterRow value={governorate} onChange={setGovernorate} />
        </>
      ) : null}
    </View>
  );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('eggMarket.title')}
        showBack
        right={
          trader.isApproved ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('actions.addOffer')}
              onPress={() => router.push(Routes.eggMarketCreate)}
            />
          ) : undefined
        }
      />

      {q.isLoading ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          {header}
          <Loading label={t('eggMarket.title')} />
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
              title={t(`eggMarket.eggType.${item.eggType}`)}
              fallbackIcon="egg-outline"
              imageUrl={item.imageUrls[0] ?? null}
              lines={[
                { label: t('eggMarket.quantityLabel'), value: `${item.quantity} ${unitLabel(item)}` },
                {
                  label: t('eggMarket.unitPriceLabel'),
                  value: `${item.pricePerUnit} ${t('eggMarket.currency')}`,
                  accent: true,
                },
              ]}
              locationLabel={[item.governorate, item.district].filter(Boolean).join(' - ')}
              createdAt={item.createdAt}
              canDelete={canManage(item)}
              onPressDetails={() => router.push(Routes.eggMarketOffer(item.id))}
              onPressCall={() => void Linking.openURL(`tel:${item.phone}`)}
              onPressWhatsapp={() =>
                void Linking.openURL(`https://wa.me/${(item.whatsapp ?? item.phone).replace(/\D/g, '')}`)
              }
              onPressDelete={() => setPendingDelete(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon="egg-outline"
              title={scope === 'mine' ? t('scope.mineEmpty') : t('eggMarket.empty')}
              message={scope === 'mine' ? t('scope.mineEmptyHint') : t('eggMarket.emptyHint')}
            />
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
                toast.show({ tone: 'success', message: t('eggMarket.deleteSuccess') });
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
