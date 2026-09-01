import { apiClient } from '@/services/api';
import type { PresignedUpload } from '@/services/files/types';

import type {
  ApplyForVeterinarianInput,
  RequestDocumentUploadUrlInput,
  VeterinarianApplication,
  VeterinarianStatusResponse,
} from '../types';

/**
 * `/api/v1/veterinarians/*` (the `self` router — authenticated users).
 * Contract: `server/src/modules/veterinarians/veterinarian.routes.ts`.
 *
 *   POST /veterinarians/apply                 body `{ note?, subType, documents[] }`
 *                                              → 201 application. 409 if already
 *                                              PENDING or APPROVED. `subType` decides
 *                                              which document kinds are required:
 *                                              VETERINARIAN → LICENSE_OR_ID (required),
 *                                              ADDITIONAL_ID (optional); STUDENT →
 *                                              STUDENT_ID_FRONT + STUDENT_ID_BACK
 *                                              (both required). Max 2 documents.
 *   POST /veterinarians/documents/upload-url  body `{ kind, filename, mimeType, size }`
 *                                              → presigned direct-upload URL.
 *   GET  /veterinarians/me/status             → `{ veterinarianStatus, application,
 *                                              subType, documents[] }`
 *
 * Approve / reject live under `/admin/veterinarians/*` and are NOT part of the
 * mobile app.
 */
export const veterinarianApi = {
  apply(input: ApplyForVeterinarianInput): Promise<VeterinarianApplication> {
    return apiClient.post<VeterinarianApplication>('/veterinarians/apply', input);
  },

  requestDocumentUploadUrl(input: RequestDocumentUploadUrlInput): Promise<PresignedUpload> {
    return apiClient.post<PresignedUpload>('/veterinarians/documents/upload-url', input);
  },

  myStatus(): Promise<VeterinarianStatusResponse> {
    return apiClient.get<VeterinarianStatusResponse>('/veterinarians/me/status');
  },
};

export type VeterinarianApi = typeof veterinarianApi;
