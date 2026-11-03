import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { QuantityStepper } from '@/features/veterinarianStore/components/QuantityStepper';
import { useTheme } from '@/theme';

import { useOrgStoreCartMutations } from '../hooks';
import { orgStoreErrorMessage } from '../utils';

interface Props {
  organizationId: string;
  productId: string;
  /** `null` price → cannot be ordered (contact the store instead). */
  hasPrice: boolean;
}

/** Quantity + "أضف إلى السلة" on a clinic / office product page. */
export function OrgStoreAddToCart({ organizationId, productId, hasPrice }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useOrgStoreCartMutations(organizationId);

  if (!hasPrice) return <Alert tone="info" message={t('addToCart.noPrice')} />;

  const onAdd = () => {
    addItem.mutate(
      { productId, quantity },
      {
        onSuccess: () => {
          setAdded(true);
          toast.show({ tone: 'success', message: t('addToCart.added') });
        },
        onError: (e) => toast.show({ tone: 'danger', message: orgStoreErrorMessage(e, t) }),
      },
    );
  };

  return (
    <View style={{ rowGap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="label" color="textSecondary">
          {t('addToCart.quantity')}
        </Text>
        <QuantityStepper value={quantity} onChange={setQuantity} busy={addItem.isPending} />
      </View>
      <Button
        label={t('addToCart.cta')}
        leftIcon="cart-outline"
        fullWidth
        loading={addItem.isPending}
        disabled={addItem.isPending}
        onPress={onAdd}
      />
      {added ? (
        <Button
          label={t('addToCart.viewCart')}
          variant="outline"
          leftIcon="bag-check-outline"
          fullWidth
          onPress={() => router.push(Routes.orgStoreCart(organizationId))}
        />
      ) : null}
    </View>
  );
}
