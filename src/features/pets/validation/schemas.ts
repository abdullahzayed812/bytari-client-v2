import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { isNotFutureIsoDate, isValidIsoDate } from '@/utils';

import { PET_SEXES, PET_SPECIES } from '../types';

/**
 * Pet form validation. Mirrors the backend EXACTLY
 * (`server/src/modules/animals/presentation/animal.schemas.ts`) — no invented
 * fields, no stricter rules. The backend re-validates authoritatively and a 422
 * is mapped back to fields by `fieldErrors()`.
 *
 *   name        trim 1–120        (required)
 *   species     enum              (required)
 *   breed       trim 1–120        (optional)
 *   sex         enum              (optional)
 *   dateOfBirth YYYY-MM-DD, ≤today (optional)
 *   notes       trim ≤2000        (optional)
 *
 * Empty optional strings are treated as "not provided".
 */
export type TFn = TFunction<'pets'>;

export function buildPetSchema(t: TFn) {
  const optionalText = (max: number) =>
    z.string().trim().max(max, t('form.errors.tooLong')).optional().or(z.literal(''));

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('form.errors.nameRequired'))
      .max(120, t('form.errors.tooLong')),
    species: z.enum(PET_SPECIES, { message: t('form.errors.speciesRequired') }),
    sex: z.enum(PET_SEXES).optional(),
    breed: z
      .string()
      .trim()
      .min(1, t('form.errors.breedInvalid'))
      .max(120, t('form.errors.tooLong'))
      .optional()
      .or(z.literal('')),
    dateOfBirth: z
      .string()
      .trim()
      .refine(isValidIsoDate, t('form.errors.dateFormat'))
      .refine((v) => isNotFutureIsoDate(v), t('form.errors.dateFuture'))
      .optional()
      .or(z.literal('')),
    notes: optionalText(2000),
    color: optionalText(60),
    /** Legacy weight in kg — positive, up to 2 decimals. */
    weightKg: z
      .string()
      .trim()
      .regex(/^\d{1,4}([.,]\d{1,2})?$/, t('form.errors.weightInvalid'))
      .refine((v) => Number(v.replace(',', '.')) > 0, t('form.errors.weightInvalid'))
      .optional()
      .or(z.literal('')),
    isNeutered: z.enum(['', 'yes', 'no']).optional(),
    /** ADMIN only (legacy admin edit) — ignored for everyone else. */
    medicalHistory: optionalText(8000),
  });
}

/** Form → API for the legacy weight / neutered fields (blank → `undefined`). */
export function toParityFields(values: PetFormValues): {
  color?: string;
  weightKg?: number;
  isNeutered?: boolean;
} {
  return {
    color: values.color?.trim() || undefined,
    weightKg: values.weightKg?.trim() ? Number(values.weightKg.replace(',', '.')) : undefined,
    isNeutered: values.isNeutered === 'yes' ? true : values.isNeutered === 'no' ? false : undefined,
  };
}

export type PetFormValues = z.infer<ReturnType<typeof buildPetSchema>>;

/** Blank optional strings → `undefined` so they are omitted from the request. */
export function toCreateInput(values: PetFormValues) {
  return {
    name: values.name.trim(),
    species: values.species,
    sex: values.sex,
    breed: values.breed?.trim() || undefined,
    dateOfBirth: values.dateOfBirth?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    ...toParityFields(values),
  };
}

// --- ownership transfer requests (request/acceptance) --------------
//
// Mirrors `createTransferRequestBodySchema` — the recipient is identified by
// their account EMAIL (`toEmail`; the server resolves it — no manual user-id
// entry), `reason` is optional free text ≤ 500.

export function buildTransferRequestSchema(t: TFn) {
  return z.object({
    toEmail: z
      .string()
      .trim()
      .min(1, t('transferRequests.errors.recipientRequired'))
      .email(t('transferRequests.errors.recipientInvalid')),
    reason: z.string().trim().max(500, t('form.errors.tooLong')).optional().or(z.literal('')),
  });
}
export type TransferRequestFormValues = z.infer<ReturnType<typeof buildTransferRequestSchema>>;

/** Feature-specific mapping for transfer-request failures; never surfaces raw text. */
export function transferRequestErrorMessage(error: unknown, t: TFn): string {
  if (error instanceof ApiError) {
    const code = error.code as string;
    if (code === 'TRANSFER_REQUEST_ALREADY_OPEN') return t('transferRequests.errors.alreadyOpen');
    if (code === 'TRANSFER_REQUEST_NOT_PENDING') return t('transferRequests.errors.notPending');
    if (code === 'ANIMAL_NOT_ACTIVE') return t('transferRequests.errors.animalNotActive');
    if (code === 'INVALID_TRANSFER_TARGET') return t('transferRequests.errors.invalidTarget');
    if (error.status === 404) return t('transferRequests.errors.recipientNotFound');
  }
  return apiErrorMessage(error);
}
