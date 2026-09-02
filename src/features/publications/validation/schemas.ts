import type { TFunction } from 'i18next';
import { z } from 'zod';

import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';

import { AGE_ESTIMATES, HEALTH_STATUSES, VACCINATION_STATUSES } from '../types';
import type {
  CreatePublicationInput,
  HealthStatus,
  PublicationKind,
  VaccinationStatus,
} from '../types';

export type PublicationTFn = TFunction<'publications'>;

// --- shared field pieces (mirror the backend schemas exactly) --------

const contactName = (t: PublicationTFn) =>
  z.string().trim().min(2, t('form.errors.contactNameRequired')).max(120);
const contactPhone = (t: PublicationTFn) =>
  z.string().trim().min(3, t('form.errors.contactPhoneRequired')).max(40);
const cityField = (t: PublicationTFn) =>
  z.string().trim().min(1, t('form.errors.cityRequired')).max(120);
const dateField = (t: PublicationTFn) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, t('form.errors.dateFormat'))
    .refine(
      (v) => !Number.isNaN(Date.parse(v)) && new Date(v) <= new Date(),
      t('form.errors.dateInvalid'),
    );
const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM')
  .optional()
  .or(z.literal(''));

// --- listing fields, per kind (the "Add X Animal" screen's lower half) ---

export function buildLostListingSchema(t: PublicationTFn) {
  return z.object({
    note: z.string().trim().max(2000).optional().or(z.literal('')),
    contactName: contactName(t),
    contactPhone: contactPhone(t),
    lostDate: dateField(t),
    lostTime: timeField,
    lostGovernorate: z.string().trim().min(1, t('form.errors.governorateRequired')).max(120),
    lostDistrict: z.string().trim().min(1, t('form.errors.districtRequired')).max(120),
    lostLocationDetail: z.string().trim().max(500).optional().or(z.literal('')),
    healthNotes: z.string().trim().max(1000).optional().or(z.literal('')),
  });
}

export function buildAdoptionListingSchema(t: PublicationTFn) {
  return z.object({
    note: z.string().trim().min(1, t('form.errors.descriptionRequired')).max(2000),
    extraNotes: z.string().trim().max(2000).optional().or(z.literal('')),
    contactName: contactName(t),
    contactPhone: contactPhone(t),
    city: cityField(t),
    healthStatus: z.enum(HEALTH_STATUSES, { message: t('form.errors.required') }),
    vaccinationStatus: z.enum(VACCINATION_STATUSES, { message: t('form.errors.required') }),
    isSterilized: z.enum(['true', 'false'], { message: t('form.errors.required') }),
  });
}

export function buildMatingListingSchema(t: PublicationTFn) {
  return z.object({
    note: z.string().trim().max(2000).optional().or(z.literal('')),
    extraNotes: z.string().trim().max(2000).optional().or(z.literal('')),
    contactName: contactName(t),
    contactPhone: contactPhone(t),
    city: cityField(t),
    healthStatus: z.enum(HEALTH_STATUSES, { message: t('form.errors.required') }),
    vaccinationStatus: z.enum(VACCINATION_STATUSES, { message: t('form.errors.required') }),
  });
}

export function buildListingSchema(t: PublicationTFn, kind: PublicationKind) {
  if (kind === 'LOST') return buildLostListingSchema(t);
  if (kind === 'ADOPTION') return buildAdoptionListingSchema(t);
  return buildMatingListingSchema(t);
}

export type LostListingValues = z.infer<ReturnType<typeof buildLostListingSchema>>;
export type AdoptionListingValues = z.infer<ReturnType<typeof buildAdoptionListingSchema>>;
export type MatingListingValues = z.infer<ReturnType<typeof buildMatingListingSchema>>;
export type ListingFieldsValues = LostListingValues | AdoptionListingValues | MatingListingValues;

/** Turn validated form values into the exact `CreatePublicationInput` the backend expects. */
export function listingValuesToInput(
  kind: PublicationKind,
  values: Record<string, unknown>,
): CreatePublicationInput {
  const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() ? v.trim() : undefined;
  if (kind === 'LOST') {
    return {
      kind: 'LOST',
      note: str(values.note),
      contactName: values.contactName as string,
      contactPhone: values.contactPhone as string,
      lostDate: values.lostDate as string,
      lostTime: str(values.lostTime),
      lostGovernorate: values.lostGovernorate as string,
      lostDistrict: values.lostDistrict as string,
      lostLocationDetail: str(values.lostLocationDetail),
      healthNotes: str(values.healthNotes),
    };
  }
  if (kind === 'ADOPTION') {
    return {
      kind: 'ADOPTION',
      note: values.note as string,
      extraNotes: str(values.extraNotes),
      contactName: values.contactName as string,
      contactPhone: values.contactPhone as string,
      city: values.city as string,
      healthStatus: values.healthStatus as HealthStatus,
      vaccinationStatus: values.vaccinationStatus as VaccinationStatus,
      isSterilized: values.isSterilized === 'true',
    };
  }
  return {
    kind: 'MATING',
    note: str(values.note),
    extraNotes: str(values.extraNotes),
    contactName: values.contactName as string,
    contactPhone: values.contactPhone as string,
    city: values.city as string,
    healthStatus: values.healthStatus as HealthStatus,
    vaccinationStatus: values.vaccinationStatus as VaccinationStatus,
  };
}

// --- animal profile fields (the "Add X Animal" screen's upper half) -----

export function buildAnimalProfileSchema(t: PublicationTFn) {
  return z.object({
    species: z.string().min(1, t('form.errors.speciesRequired')),
    breed: z.string().trim().max(120).optional().or(z.literal('')),
    name: z.string().trim().max(120).optional().or(z.literal('')),
    sex: z.string().min(1, t('form.errors.sexRequired')),
    color: z.string().trim().max(80).optional().or(z.literal('')),
    ageEstimate: z.enum(AGE_ESTIMATES).optional().or(z.literal('')),
    distinguishingFeatures: z.string().trim().max(500).optional().or(z.literal('')),
  });
}
export type AnimalProfileValues = z.infer<ReturnType<typeof buildAnimalProfileSchema>>;

// --- error mapping ---------------------------------------------------

export function publicationErrorMessage(error: unknown, t: PublicationTFn): string {
  if (error instanceof ApiError) {
    const code = error.code as string;
    if (code === 'ANIMAL_NOT_ACTIVE') return t('errors.animalNotActive');
    if (code === 'PUBLICATION_ALREADY_OPEN') return t('errors.alreadyOpen');
    if (error.status === 409) return t('errors.conflict');
    if (code === 'PERMISSION_DENIED' || error.status === 404) return t('errors.notYourAnimal');
  }
  return apiErrorMessage(error);
}
