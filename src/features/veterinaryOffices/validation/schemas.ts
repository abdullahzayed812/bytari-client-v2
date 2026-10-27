import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

import { VETERINARY_OFFICE_PRODUCT_CURRENCIES, VETERINARY_OFFICE_PRODUCT_TYPES } from '../types';

/**
 * Veterinary Office product form validation (management). Mirrors the backend
 * EXACTLY (`server/src/modules/veterinary-office/presentation/veterinary-office-product.schemas.ts`
 * / OpenAPI `phase10`) — same lengths, same enums, same price pattern. The
 * backend re-validates authoritatively.
 */
export type VeterinaryOfficeTFn = TFunction<'veterinaryOffices'>;

/** Backend: `price` is `^\d{1,8}(\.\d{1,2})?$` or null (numeric(12,2), never a float). */
const PRICE_RE = /^\d{1,8}(\.\d{1,2})?$/;

/**
 *   name         trim 1–200            (required)
 *   productType  enum                  (required)
 *   price        "12" | "12.50" | ""   (optional → null)
 *   currency     IQD | USD             (defaults to IQD)
 *   description  trim ≤ 4000           (optional)
 *   status       enum (edit only, handled outside the shared form)
 */
export function buildVeterinaryOfficeProductSchema(t: VeterinaryOfficeTFn) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('manage.form.errors.nameRequired'))
      .max(200, t('manage.form.errors.tooLong')),
    productType: z.enum(VETERINARY_OFFICE_PRODUCT_TYPES, {
      message: t('manage.form.errors.typeRequired'),
    }),
    // Kept as validated strings so the RHF fields round-trip cleanly; the screen
    // converts them for the request body.
    price: z
      .string()
      .trim()
      .regex(PRICE_RE, t('manage.form.errors.priceInvalid'))
      .optional()
      .or(z.literal('')),
    currency: z.enum(VETERINARY_OFFICE_PRODUCT_CURRENCIES),
    description: z
      .string()
      .trim()
      .max(4000, t('manage.form.errors.tooLong'))
      .optional()
      .or(z.literal('')),
    // Catalog filters (mirrors the backend limits).
    brand: z.string().trim().max(120, t('manage.form.errors.tooLong')).optional().or(z.literal('')),
    countryOfOrigin: z
      .string()
      .trim()
      .max(80, t('manage.form.errors.tooLong'))
      .optional()
      .or(z.literal('')),
    manufacturer: z
      .string()
      .trim()
      .max(300, t('manage.form.errors.tooLong'))
      .optional()
      .or(z.literal('')),
  });
}
export type VeterinaryOfficeProductFormValues = z.infer<
  ReturnType<typeof buildVeterinaryOfficeProductSchema>
>;

/**
 * Feature-specific error mapping for office/product mutations. Layers the
 * known backend cases on top of the generic `apiErrorMessage`; never surfaces
 * raw text.
 */
export function veterinaryOfficeErrorMessage(error: unknown, t: VeterinaryOfficeTFn): string {
  if (error instanceof ApiError) {
    const code = error.code as string;
    if (code === 'ORGANIZATION_TYPE_NOT_SUPPORTED') return t('manage.errors.notOffice');
    if (code === 'PERMISSION_DENIED' && error.status === 403) return t('manage.errors.forbidden');
    if (error.status === 404) return t('manage.errors.notFound');
  }
  return apiErrorMessage(error);
}
