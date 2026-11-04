import type { TFunction } from 'i18next';

import { formatAmount } from '@/features/veterinarianStore/utils';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

import type { OrgStoreCurrency } from './types';

/** `"25000.00"`, `IQD` → `"25,000 د.ع"` — display only, the decimal string is what the API takes. */
export function formatOrgStoreMoney(
  t: TFunction<'organizationStore'>,
  amount: string,
  currency: OrgStoreCurrency | null | undefined,
): string {
  return t('common.price', {
    value: formatAmount(amount),
    currency: t(`common.currency.${currency === 'USD' ? 'USD' : 'IQD'}`),
  });
}

const STORE_ERROR_CODES = [
  'PRODUCT_NOT_PURCHASABLE',
  'STORE_CART_CURRENCY_MISMATCH',
  'ORDER_INVALID_TRANSITION',
  'STORE_DISABLED',
  'STORE_ORDERS_DISABLED',
] as const;

/** Store-specific error copy first, then the app-wide mapping. */
export function orgStoreErrorMessage(error: unknown, t: TFunction<'organizationStore'>): string {
  if (error instanceof ApiError) {
    const raw = error.code as string;
    const code = STORE_ERROR_CODES.find((c) => c === raw);
    if (code) return t(`errors.${code}`);
  }
  return apiErrorMessage(error);
}
