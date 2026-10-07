import type { MedicalRecord, Vaccination } from '../types';

/** Defaults for the legacy-parity medical fields, spread into test fixtures. */
export const recordExtras: Pick<
  MedicalRecord,
  | 'symptoms'
  | 'severity'
  | 'labNotes'
  | 'recordType'
  | 'isDraft'
  | 'prescriptionKey'
  | 'prescriptionUrl'
  | 'attachmentKeys'
  | 'attachmentUrls'
> = {
  symptoms: null,
  severity: null,
  labNotes: null,
  recordType: 'GENERAL',
  isDraft: false,
  prescriptionKey: null,
  prescriptionUrl: null,
  attachmentKeys: [],
  attachmentUrls: [],
};

export const vaccinationExtras: Pick<Vaccination, 'status'> = { status: 'COMPLETED' };
