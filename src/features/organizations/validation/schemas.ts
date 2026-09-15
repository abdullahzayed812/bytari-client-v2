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

/**
 * Clinic / Veterinary Office registration form ("تسجيل العيادة" / "تسجيل المكتب").
 * Mirrors the backend's `profileFieldsShape` + `licenseNumber`
 * (`server/src/modules/organizations/presentation/organization.schemas.ts`).
 * `phone` is required for CLINIC only, per the reference screenshots — optional
 * otherwise. License photos / gallery photos are plain local state, validated
 * separately (they are files, not form-field text).
 */
export function buildRegistrationSchema(t: OrgTFn, options: { phoneRequired: boolean }) {
  const optionalUrl = z
    .string()
    .trim()
    .url({ message: t('registration.errors.invalidUrl') })
    .optional()
    .or(z.literal(''));

  return z.object({
    name: z
      .string()
      .trim()
      .min(2, t('form.errors.nameRequired'))
      .max(160, t('form.errors.tooLong')),
    description: z.string().trim().max(2000, t('form.errors.tooLong')).optional().or(z.literal('')),
    address: z.string().trim().min(1, t('registration.errors.addressRequired')).max(300),
    country: z.string().trim().min(1, t('registration.errors.countryRequired')),
    phone: options.phoneRequired
      ? z.string().trim().min(1, t('registration.errors.phoneRequired')).max(30)
      : z.string().trim().max(30).optional().or(z.literal('')),
    email: z
      .string()
      .trim()
      .email({ message: t('registration.errors.invalidEmail') })
      .optional()
      .or(z.literal('')),
    workingHours: z.string().trim().max(200).optional().or(z.literal('')),
    services: z.string().trim().max(500).optional().or(z.literal('')),
    websiteUrl: optionalUrl,
    facebookUrl: optionalUrl,
    instagramUrl: optionalUrl,
    whatsapp: z.string().trim().max(30).optional().or(z.literal('')),
    licenseNumber: z.string().trim().min(1, t('registration.errors.licenseNumberRequired')).max(120),
  });
}

export type RegistrationFormValues = z.infer<ReturnType<typeof buildRegistrationSchema>>;

/** Splits the comma-separated "services" free-text field into a trimmed, non-empty array. */
export function servicesToArray(services: string | undefined): string[] {
  if (!services?.trim()) return [];
  return services
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Split the single "email or user id" field into the right request field. */
export function memberIdentifierToInput(identifier: string): { userId?: string; email?: string } {
  const trimmed = identifier.trim();
  return z.string().uuid().safeParse(trimmed).success
    ? { userId: trimmed }
    : { email: trimmed.toLowerCase() };
}
