import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Alert, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { usePublicOrganization } from '@/features/organizations';
import { useTheme } from '@/theme';

import { OrgStoreCartLine, OrgStorePriceSummary } from '../components';
import { useOrgStoreCart, useOrgStoreCartMutations } from '../hooks';
import { orgStoreErrorMessage } from '../utils';

/** Route `/organization-store/[organizationId]/cart` — one clinic / office store's cart. */
export default function OrganizationStoreCartScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const store = usePublicOrganization(orgId);
  const q = useOrgStoreCart(orgId);
  const { updateItem, removeItem, clear } = useOrgStoreCartMutations(orgId);
  const cart = q.data;
  const busy = updateItem.isPending || removeItem.isPending || clear.isPending;
  const hasUnavailable = cart?.items.some((i) => !i.available) ?? false;
  const onError = (e: unknown) =>
    toast.show({ tone: 'danger', message: orgStoreErrorMessage(e, t) });
  const browse = () => router.push(Routes.veterinaryOfficeProducts(orgId));

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('cart.title')}
        subtitle={store.data?.name}
        showBack
        right={
          <TextButton
            label={t('orders.shortTitle')}
            onPress={() => router.push(Routes.orgStoreOrders)}
          />
        }
      />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !cart || cart.items.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title={t('cart.empty')}
          message={t('cart.emptyHint')}
          actionLabel={t('cart.browse')}
          onAction={browse}
        />
      ) : (
        <>
          <FlatList
            data={cart.items}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <OrgStoreCartLine
                item={item}
                busy={busy}
                onChangeQuantity={(quantity) =>
                  updateItem.mutate({ itemId: item.id, quantity }, { onError })
                }
                onRemove={() => removeItem.mutate(item.id, { onError })}
              />
            )}
            ListHeaderComponent={
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: theme.spacing.sm,
                }}
              >
                <Caption>{t('cart.itemCount', { count: cart.itemCount })}</Caption>
                <TextButton
                  label={t('cart.clear')}
                  onPress={() => clear.mutate(undefined, { onError })}
                />
              </View>
            }
            ListFooterComponent={<Caption>{t('cart.deliveryNote')}</Caption>}
            contentContainerStyle={{
              padding: theme.screenPadding,
              rowGap: theme.spacing.md,
              paddingBottom: theme.spacing.huge,
            }}
          />
          <View
            style={{
              padding: theme.screenPadding,
              rowGap: theme.spacing.md,
              borderTopWidth: theme.sizes.hairline,
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.background,
            }}
          >
            {hasUnavailable ? <Alert tone="warning" message={t('cart.hasUnavailable')} /> : null}
            <OrgStorePriceSummary
              subtotalAmount={cart.subtotalAmount}
              deliveryFee={cart.deliveryFee}
              totalAmount={cart.totalAmount}
              currency={cart.currency}
            />
            <Button
              label={t('cart.checkout')}
              fullWidth
              disabled={hasUnavailable || busy}
              onPress={() => router.push(Routes.orgStoreCheckout(orgId))}
            />
          </View>
        </>
      )}
    </SafeAreaScreen>
  );
}
