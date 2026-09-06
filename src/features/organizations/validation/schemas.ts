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

/** UUID check for the "assign supervisor" user-id input (email lookup isn't offered there — a
 *  supervisor must already be an approved veterinarian, a narrower audience than plain staff). */
export function buildUserIdSchema(t: OrgTFn) {
  return z.object({
    userId: z
      .string()
      .trim()
      .uuid({ message: t('form.errors.userIdInvalid') }),
  });
}

/**
 * "Add member" identifier — accepts either the target's email (must belong to
 * an existing account, resolved server-side) or their raw user id (UUID).
 */
export function buildMemberIdentifierSchema(t: OrgTFn) {
  return z.object({
    identifier: z
      .string()
      .trim()
      .min(1, t('members.errors.identifierRequired'))
      .refine(
        (v) => z.string().uuid().safeParse(v).success || z.string().email().safeParse(v).success,
        { message: t('members.errors.identifierInvalid') },
      ),
  });
}
export type MemberIdentifierFormValues = z.infer<ReturnType<typeof buildMemberIdentifierSchema>>;

/** Split the single "email or user id" field into the right request field. */
export function memberIdentifierToInput(identifier: string): { userId?: string; email?: string } {
  const trimmed = identifier.trim();
  return z.string().uuid().safeParse(trimmed).success
    ? { userId: trimmed }
    : { email: trimmed.toLowerCase() };
}
