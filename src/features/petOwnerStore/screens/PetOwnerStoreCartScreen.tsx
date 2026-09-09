import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { CartLineItem, PriceSummary, StoreHeader } from '../components';
import { usePetOwnerStoreCart, usePetOwnerStoreCartMutations } from '../hooks';

/** Route `/pet-owner-store/cart` — سلة المشتريات. */
export default function PetOwnerStoreCartScreen() {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');
  const toast = useToast();

  const q = usePetOwnerStoreCart();
  const { updateItem, removeItem, clear } = usePetOwnerStoreCartMutations();
  const cart = q.data;
  const busy = updateItem.isPending || removeItem.isPending || clear.isPending;

  const onError = (e: unknown): void => toast.show({ message: apiErrorMessage(e), tone: 'danger' });

  return (
    <SafeAreaScreen>
      <StoreHeader title={t('cart.title')} showBack />

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
          onAction={() => router.replace(Routes.petOwnerStore)}
        />
      ) : (
        <>
          <FlatList
            data={cart.items}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <CartLineItem
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
            ListFooterComponent={
              <Card variant="accent" padding="md" style={{ marginTop: theme.spacing.md }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: theme.spacing.sm,
                  }}
                >
                  <Icon name="shield-checkmark-outline" size="iconSm" color="success" />
                  <Text variant="label" color="success">
                    {t('cart.freeDeliveryNote')}
                  </Text>
                </View>
              </Card>
            }
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
            <PriceSummary
              subtotalAmount={cart.subtotalAmount}
              deliveryFee={cart.deliveryFee}
              totalAmount={cart.totalAmount}
            />
            <Button
              label={t('cart.checkout')}
              fullWidth
              rightIcon="arrow-forward"
              onPress={() => router.push(Routes.petOwnerStoreCheckout)}
            />
          </View>
        </>
      )}
    </SafeAreaScreen>
  );
}
