import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
      .regex(DATE_RE, t('form.errors.dateFormat'))
      .refine(
        (v) => !Number.isNaN(Date.parse(v)) && new Date(v) <= new Date(),
        t('form.errors.dateFuture'),
      )
      .optional()
      .or(z.literal('')),
    notes: optionalText(2000),
  });
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
  };
}

// --- ownership transfer (Phase 12) ---------------------------------
//
// Mirrors `transferOwnershipBodySchema` — `toUserId` is a UUID, `reason` is
// optional free text ≤ 500. There is NO user directory search on the backend,
// so the recipient is entered as a raw user id (the screen resolves it to a
// name live via `GET /users/:id` before the confirmation step).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildTransferSchema(t: TFn) {
  return z.object({
    toUserId: z
      .string()
      .trim()
      .min(1, t('transfer.errors.recipientRequired'))
      .regex(UUID_RE, t('transfer.errors.recipientInvalid')),
    reason: z.string().trim().max(500, t('form.errors.tooLong')).optional().or(z.literal('')),
  });
}
export type TransferFormValues = z.infer<ReturnType<typeof buildTransferSchema>>;

/** Feature-specific mapping for transfer failures; never surfaces raw text. */
export function transferErrorMessage(error: unknown, t: TFn): string {
  if (error instanceof ApiError) {
    const code = error.code as string;
    if (code === 'ANIMAL_NOT_ACTIVE') return t('transfer.errors.animalNotActive');
    if (code === 'INVALID_TRANSFER_TARGET') return t('transfer.errors.invalidTarget');
    if (error.status === 404) return t('transfer.errors.recipientNotFound');
    if (error.status === 409) return t('transfer.errors.conflict');
    if (error.status === 403) return t('transfer.errors.notOwner');
  }
  return apiErrorMessage(error);
}
