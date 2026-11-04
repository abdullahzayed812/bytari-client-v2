import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/feedback';

import { orgStoreErrorMessage } from '../utils';

import { useOrgStoreCartMutations } from './useOrgStoreCart';

/**
 * One-tap "تسوق" from a clinic / office product card: adds ONE unit to the
 * shopper's cart for that store (same endpoint + error copy as the product
 * page's `OrgStoreAddToCart`). `isAdding(id)` drives the per-card spinner.
 */
export function useOrgStoreQuickAdd(organizationId: string) {
  const { t } = useTranslation('organizationStore');
  const toast = useToast();
  const { addItem } = useOrgStoreCartMutations(organizationId);

  const add = (productId: string): void => {
    if (addItem.isPending) return;
    addItem.mutate(
      { productId, quantity: 1 },
      {
        onSuccess: () => toast.show({ tone: 'success', message: t('addToCart.added') }),
        onError: (e) => toast.show({ tone: 'danger', message: orgStoreErrorMessage(e, t) }),
      },
    );
  };
  const isAdding = (productId: string): boolean =>
    addItem.isPending && addItem.variables?.productId === productId;

  return { add, isAdding };
}
