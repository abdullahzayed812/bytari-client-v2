import type { Gender } from '@/features/auth';
import type { VeterinarianDocumentKind, VeterinarianSubType } from '@/features/veterinarian';

export type { Gender, VeterinarianDocumentKind, VeterinarianSubType };

/** A completed presigned upload, kept in RHF state until the final submit. */
export interface DocumentRef {
  storageKey: string;
  filename: string;
  mimeType: string;
}

export interface CountryOption {
  /** ISO-3166 alpha-2, uppercase. */
  code: string;
  nameAr: string;
  nameEn: string;
}

/** Which success copy `RegistrationSuccessScreen` renders. */
export type RegistrationOutcome = 'owner' | 'veterinarian-pending';
