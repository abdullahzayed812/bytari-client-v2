/**
 * Medical feature — Mobile Phase 6. Veterinary medical records & vaccinations
 * for an animal, against `server/src/modules/veterinary-care`.
 *
 *  - CLINIC context (organization-scoped) — full CRUD, `medical_record.*` /
 *    `vaccination.*` org permissions + an ACTIVE veterinary-access grant. A
 *    clinic reads the animal's complete history but edits only its own entries.
 *  - OWNER context (animal-scoped) — READ-ONLY, current owner or ADMIN.
 *
 * No optimistic updates (§32). No chat / realtime / notifications / attachments
 * / appointments — later phases.
 */
export {
  medicalRecordsApi,
  vaccinationsApi,
  medicalHistoryApi,
  medicalKeys,
  medicalScopeTag,
  type MedicalRecordsApi,
  type VaccinationsApi,
  type MedicalHistoryApi,
} from './api';
export {
  useMedicalRecords,
  useMedicalRecord,
  useVaccinations,
  useVaccination,
  useMedicalTimeline,
  useCreateMedicalRecord,
  useUpdateMedicalRecord,
  useDeleteMedicalRecord,
  useCreateVaccination,
  useUpdateVaccination,
  useDeleteVaccination,
} from './hooks';
export {
  MedicalRecordCard,
  VaccinationCard,
  MedicalTimelineItem,
  RecordCardSkeleton,
  MedicalRecordForm,
  VaccinationForm,
  type MedicalRecordCardProps,
  type VaccinationCardProps,
  type MedicalTimelineItemProps,
} from './components';
export {
  MedicalRecordsScreen,
  MedicalRecordDetailScreen,
  MedicalRecordFormScreen,
  VaccinationsScreen,
  VaccinationDetailScreen,
  VaccinationFormScreen,
  MedicalTimelineScreen,
  useMedicalRouteScope,
  type MedicalRouteScope,
} from './screens';
export { recordedByThisClinic, displayDateOnly } from './constants';
export {
  buildMedicalRecordSchema,
  buildVaccinationSchema,
  medicalErrorMessage,
  type MedicalRecordFormValues,
  type VaccinationFormValues,
  type MedicalTFn,
} from './validation/schemas';
export * from './types';
