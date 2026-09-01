/**
 * Veterinarian feature — Mobile Phase 4. The Veterinarian Home shown in
 * Veterinarian Mode, plus the veterinarian-application (apply / re-apply) flow.
 * Approval is decided by an admin server-side; this module never grants status.
 */
export { veterinarianApi, vetKeys, type VeterinarianApi } from './api';
export {
  useVeterinarianApplicationStatus,
  useApplyForVeterinarian,
  useVeterinarianDocumentPresignProvider,
  type UseVeterinarianDocumentPresignProvider,
  type VeterinarianDocumentRef,
} from './hooks';
export { VeterinarianHomeScreen, VeterinarianApplyScreen } from './screens';
export { buildApplySchema, type ApplyFormValues, type VetTFn } from './validation/schemas';
export {
  VET_APPLICATION_STATUSES,
  VETERINARIAN_SUB_TYPES,
  VETERINARIAN_DOCUMENT_KINDS,
  type VetApplicationStatus,
  type VeterinarianSubType,
  type VeterinarianDocumentKind,
  type VeterinarianApplicationDocument,
  type VeterinarianApplication,
  type VeterinarianStatusResponse,
  type ApplyForVeterinarianInput,
  type ApplyDocumentInput,
  type RequestDocumentUploadUrlInput,
} from './types';
