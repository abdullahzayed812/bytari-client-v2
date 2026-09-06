import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

import { BIRD_TYPES, EGG_TYPES, PRICING_METHODS, SELL_UNITS, TRADER_TYPES } from '../types';

export type MarketTFn = TFunction<'poultryMarket'>;

const moneySchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^\d{1,8}(\.\d{1,2})?$/, 'invalid amount');
const weightSchema = z
  .string()
  .trim()
  .regex(/^\d{1,4}(\.\d{1,2})?$/, 'invalid weight')
  .optional()
  .or(z.literal(''));
const phoneLike = z.string().trim().min(3).max(40);

// --- trader registration ---------------------------------------------

export function buildRegisterTraderSchema(t: MarketTFn) {
  return z.object({
    displayName: z.string().trim().min(2, t('register.errors.nameRequired')).max(160),
    traderType: z.enum(TRADER_TYPES),
    governorate: z.string().min(1, t('register.errors.governorateRequired')),
    district: z.string().trim().max(120).optional().or(z.literal('')),
    phone: phoneLike.refine((v) => v.length > 0, t('register.errors.phoneRequired')),
    whatsapp: phoneLike.optional().or(z.literal('')),
    bio: z.string().trim().max(2000).optional().or(z.literal('')),
    termsAccepted: z.literal(true, { message: t('register.errors.termsRequired') }),
  });
}
export type RegisterTraderFormValues = z.infer<ReturnType<typeof buildRegisterTraderSchema>>;

// --- poultry offer -----------------------------------------------

export function buildPoultryOfferSchema(t: MarketTFn) {
  return z.object({
    birdType: z.enum(BIRD_TYPES),
    breed: z.string().trim().max(160).optional().or(z.literal('')),
    quantity: z
      .string()
      .trim()
      .min(1, t('poultryMarket.fieldQuantity'))
      .regex(/^\d{1,9}$/),
    pricingMethod: z.enum(PRICING_METHODS),
    price: moneySchema,
    ageWeeks: z
      .string()
      .trim()
      .regex(/^\d{1,3}$/)
      .optional()
      .or(z.literal('')),
    weightKg: weightSchema,
    governorate: z.string().min(1, t('register.errors.governorateRequired')),
    district: z.string().trim().max(120).optional().or(z.literal('')),
    phone: phoneLike,
    whatsapp: phoneLike.optional().or(z.literal('')),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
  });
}
export type PoultryOfferFormValues = z.infer<ReturnType<typeof buildPoultryOfferSchema>>;

// --- egg offer -----------------------------------------------

export function buildEggOfferSchema(t: MarketTFn) {
  return z.object({
    eggType: z.enum(EGG_TYPES),
    sellUnit: z.enum(SELL_UNITS),
    quantity: z
      .string()
      .trim()
      .min(1, t('eggMarket.fieldQuantity'))
      .regex(/^\d{1,9}$/),
    pricePerUnit: moneySchema,
    governorate: z.string().min(1, t('register.errors.governorateRequired')),
    district: z.string().trim().max(120).optional().or(z.literal('')),
    phone: phoneLike,
    whatsapp: phoneLike.optional().or(z.literal('')),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
  });
}
export type EggOfferFormValues = z.infer<ReturnType<typeof buildEggOfferSchema>>;

// --- errors ---------------------------------------------------

export function marketErrorMessage(error: unknown, t: MarketTFn): string {
  if (error instanceof ApiError) {
    const code = error.code as string;
    if (code === 'TRADER_APPROVAL_REQUIRED') return t('gate.notRegisteredBody');
    if (error.status === 404) return t('poultryMarket.notFound');
    if (error.status === 403) return t('gate.notRegisteredBody');
  }
  return apiErrorMessage(error);
}
