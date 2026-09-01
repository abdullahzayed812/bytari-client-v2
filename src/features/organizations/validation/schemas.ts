import type { TFunction } from 'i18next';
import { z } from 'zod';

import { ORGANIZATION_TYPES } from '../types';

/**
 * Organization form validation. Mirrors the backend EXACTLY
 * (`server/src/modules/organizations/presentation/organization.schemas.ts`) —
 * same lengths, same enums, no stricter rules. The backend re-validates
 * authoritatively; a 422 is mapped back onto fields by `fieldErrors()`.
 *
 *   create:  type enum (required) · name trim 2–160 · description trim ≤2000 (optional)
 *   update:  name trim 2–160 (optional) · description ≤2000 (optional, clearable)
 *
 * The client never sends `type` on update, and never sends `ownerUserId`,
 * `status`, or any approval field on either — those are backend-owned.
 */
export type OrgTFn = TFunction<'organizations'>;

export function buildCreateOrganizationSchema(t: OrgTFn) {
  return z.object({
    type: z.enum(ORGANIZATION_TYPES, { message: t('form.errors.typeRequired') }),
    name: z
      .string()
      .trim()
      .min(2, t('form.errors.nameRequired'))
      .max(160, t('form.errors.tooLong')),
    description: z.string().trim().max(2000, t('form.errors.tooLong')).optional().or(z.literal('')),
  });
}

export type CreateOrganizationFormValues = z.infer<
  ReturnType<typeof buildCreateOrganizationSchema>
>;

export function buildEditOrganizationSchema(t: OrgTFn) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, t('form.errors.nameRequired'))
      .max(160, t('form.errors.tooLong')),
    description: z.string().trim().max(2000, t('form.errors.tooLong')).optional().or(z.literal('')),
  });
}

export type EditOrganizationFormValues = z.infer<ReturnType<typeof buildEditOrganizationSchema>>;

/** UUID check for the "add member" / "assign supervisor" user-id inputs. */
export function buildUserIdSchema(t: OrgTFn) {
  return z.object({
    userId: z
      .string()
      .trim()
      .uuid({ message: t('form.errors.userIdInvalid') }),
  });
}
