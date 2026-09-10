import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

import { VETERINARY_STORE_PRODUCT_TYPES } from '../types';

/**
 * Veterinary-store product form validation. Mirrors the backend EXACTLY
 * (`server/src/modules/veterinary-store/presentation/store.schemas.ts` /
 * OpenAPI `phase10`) — same lengths, same enums, same price pattern. The
 * backend re-validates authoritatively (§37: it also owns every monetary value).
 */
export type VeterinaryStoreTFn = TFunction<'veterinaryStore'>;

/** Backend: `price` is `^\d{1,8}(\.\d{1,2})?$` or null (numeric(12,2), never a float). */
const PRICE_RE = /^\d{1,8}(\.\d{1,2})?$/;
/** Opening stock / stock delta magnitude — a plain non-negative integer. */
const UINT_RE = /^\d{1,9}$/;
/** Signed, non-zero integer for a stock adjustment (`-12`, `40`, …). */
const SIGNED_INT_RE = /^-?\d{1,9}$/;

/**
 *   name         trim 1–200            (required)
 *   productType  enum                  (required)
 *   price        "12" | "12.50" | ""   (optional → null)
 *   stockQuantity "0".."999999999" | "" (create only; optional → 0)
 *   description  trim ≤ 4000           (optional)
 *   status       enum (edit only, handled outside the shared form)
 */
export function buildVeterinaryStoreProductSchema(t: VeterinaryStoreTFn) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('form.errors.nameRequired'))
      .max(200, t('form.errors.tooLong')),
    productType: z.enum(VETERINARY_STORE_PRODUCT_TYPES, { message: t('form.errors.typeRequired') }),
    // Kept as validated strings so the RHF fields round-trip cleanly; the screen
    // converts them for the request body.
    price: z
      .string()
      .trim()
      .regex(PRICE_RE, t('form.errors.priceInvalid'))
      .optional()
      .or(z.literal('')),
    stockQuantity: z
      .string()
      .trim()
      .regex(UINT_RE, t('form.errors.stockInvalid'))
      .optional()
      .or(z.literal('')),
    description: z.string().trim().max(4000, t('form.errors.tooLong')).optional().or(z.literal('')),
  });
}
export type VeterinaryStoreProductFormValues = z.infer<ReturnType<typeof buildVeterinaryStoreProductSchema>>;

/**
 *   delta   signed non-zero int   (required)
 *   reason  trim 1–500            (optional)
 */
export function buildAdjustVeterinaryStoreStockSchema(t: VeterinaryStoreTFn) {
  return z.object({
    delta: z
      .string()
      .trim()
      .min(1, t('stock.errors.deltaRequired'))
      .regex(SIGNED_INT_RE, t('stock.errors.deltaInvalid'))
      .refine((v) => Number(v) !== 0, t('stock.errors.deltaZero')),
    reason: z.string().trim().max(500, t('form.errors.tooLong')).optional().or(z.literal('')),
  });
}
export type AdjustVeterinaryStoreStockFormValues = z.infer<ReturnType<typeof buildAdjustVeterinaryStoreStockSchema>>;

/**
 * Feature-specific error mapping for store/product mutations. Layers the known
 * backend cases on top of the generic `apiErrorMessage`; never surfaces raw text.
 */
export function veterinaryStoreErrorMessage(error: unknown, t: VeterinaryStoreTFn): string {
  if (error instanceof ApiError) {
    const code = error.code as string;
    if (code === 'ORGANIZATION_TYPE_NOT_SUPPORTED') return t('errors.notStore');
    if (code === 'INSUFFICIENT_STOCK') return t('stock.errors.belowZero');
    if (code === 'PERMISSION_DENIED' && error.status === 403) return t('errors.forbidden');
    if (error.status === 404) return t('errors.notFound');
  }
  return apiErrorMessage(error);
}
