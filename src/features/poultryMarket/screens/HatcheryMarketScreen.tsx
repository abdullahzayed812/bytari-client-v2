import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Linking, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { SafeAreaScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { Advertisement } from '@/features/ads';
import { useAuthStore } from '@/features/auth/store';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate, openPhone } from '@/utils';

import { GovernorateFilterRow, MarketOfferCard } from '../components';
import { MarketAccessGate } from '../components/MarketAccessGate';
import { CHICK_TYPE_ORDER } from '../constants';
import {
  useDeleteHatcheryOffer,
  useHatcheryOffers,
  useMarketAccess,
  useMyHatcheryOffers,
} from '../hooks';
import type { ChickType, HatcheryOffer } from '../types';

/**
 * Route `/(app)/poultry/hatchery-market` — عروض المفاقس. Same layout, access
 * gate and moderation flow as the egg market (`EggMarketScreen`): browse
 * APPROVED offers, an eligible seller adds offers (sent to Admin for review)
 * and sees their own under "عروضي" with the review state (subtitle).
 */
export default function HatcheryMarketScreen() {
  const { t } = useTranslation('poultryMarket');
  return (
    <MarketAccessGate title={t('hatcheryMarket.title')}>
      <HatcheryMarketContent />
    </MarketAccessGate>
  );
}

function HatcheryMarketContent() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { isAdmin, isSupervisorOf } = useCapabilities();
  const user = useAuthStore((s) => s.user);
  // Selling = an eligible merchant OR poultry farm (server-evaluated).
  const canSell = useMarketAccess().data?.sections.sell ?? false;

  const [chickType, setChickType] = useState<ChickType | undefined>(undefined);
  const [governorate, setGovernorate] = useState<string | undefined>(undefined);
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const allQ = useHatcheryOffers({ chickType, governorate, enabled: scope === 'all' });
  const mineQ = useMyHatcheryOffers({ enabled: scope === 'mine' && canSell });
  const q = scope === 'all' ? allQ : mineQ;
  const del = useDeleteHatcheryOffer();

  const canManage = (offer: HatcheryOffer): boolean =>
    offer.traderUserId === user?.id || isAdmin || isSupervisorOf('MARKET');

  const titleOf = (offer: HatcheryOffer): string =>
    [t(`hatcheryMarket.chickType.${offer.chickType}`), offer.breed].filter(Boolean).join(' - ');

  const header = (
    <View style={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
      <Section spacing="md">
        <Advertisement placement="HATCHERY_MARKET" />
      </Section>
      {canSell ? (
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
            data={[undefined, ...CHICK_TYPE_ORDER]}
            keyExtractor={(v) => v ?? 'ALL'}
            contentContainerStyle={{
              paddingHorizontal: theme.screenPadding,
              columnGap: theme.spacing.sm,
            }}
            renderItem={({ item }) => (
              <Chip
                label={
                  item ? t(`hatcheryMarket.chickType.${item}`) : t('hatcheryMarket.chickType.ALL')
                }
                selected={chickType === item}
                onPress={() => setChickType(item)}
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
        title={t('hatcheryMarket.title')}
        showBack
        right={
          canSell ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('actions.addOffer')}
              onPress={() => router.push(Routes.hatcheryMarketCreate)}
            />
          ) : undefined
        }
      />

      {q.isLoading ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          {header}
          <Loading label={t('hatcheryMarket.title')} />
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
              title={titleOf(item)}
              // "عروضي": the seller sees where their request is in the Admin review.
              subtitle={
                scope === 'mine'
                  ? [
                      t(`hatcheryMarket.moderation.${item.moderationStatus ?? 'APPROVED'}`),
                      item.moderationStatus === 'REJECTED' ? item.rejectionReason : null,
                    ]
                      .filter(Boolean)
                      .join(' — ')
                  : undefined
              }
              fallbackIcon="egg-outline"
              imageUrl={item.imageUrls[0] ?? null}
              lines={[
                {
                  label: t('hatcheryMarket.ageLabel'),
                  value: t('hatcheryMarket.ageValue', { days: item.chickAgeDays }),
                },
                {
                  label: t('hatcheryMarket.productionDateLabel'),
                  value: formatDate(item.productionDate),
                },
                ...(item.pricePerChick != null
                  ? [
                      {
                        label: t('hatcheryMarket.pricePerChickLabel'),
                        value: `${item.pricePerChick} ${t('hatcheryMarket.currency')}`,
                        accent: true,
                      },
                    ]
                  : []),
              ]}
              locationLabel={[item.governorate, item.district].filter(Boolean).join(' - ')}
              createdAt={item.createdAt}
              canDelete={canManage(item)}
              onPressDetails={() => router.push(Routes.hatcheryMarketOffer(item.id))}
              onPressCall={() => void openPhone(item.phone)}
              onPressWhatsapp={() =>
                void Linking.openURL(
                  `https://wa.me/${(item.whatsapp ?? item.phone).replace(/\D/g, '')}`,
                )
              }
              onPressDelete={() => setPendingDelete(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon="egg-outline"
              title={scope === 'mine' ? t('scope.mineEmpty') : t('hatcheryMarket.empty')}
              message={scope === 'mine' ? t('scope.mineEmptyHint') : t('hatcheryMarket.emptyHint')}
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
                toast.show({ tone: 'success', message: t('hatcheryMarket.deleteSuccess') });
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
