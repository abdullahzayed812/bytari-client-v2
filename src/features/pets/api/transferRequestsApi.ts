import { apiClient } from '@/services/api';
import type { PageMeta } from '@/services/api';

import type { AnimalTransferRequest, CreateTransferRequestInput } from '../types';

export interface TransferRequestListPage {
  items: AnimalTransferRequest[];
  meta: PageMeta;
}

/**
 * Thin wrappers over the request/acceptance ownership-transfer workflow.
 * Contract: `server/src/modules/animals/presentation/transfer-request.routes.ts`.
 *  - `POST /animals/:animalId/transfer-requests`      → owner-only; starts PENDING
 *  - `GET  /animal-transfer-requests/sent`            → requests I created
 *  - `GET  /animal-transfer-requests/received`        → requests proposing me as the new owner
 *  - `POST /animal-transfer-requests/:id/accept`      → recipient-only; ownership actually moves
 *  - `POST /animal-transfer-requests/:id/reject`      → recipient-only
 *  - `POST /animal-transfer-requests/:id/cancel`      → sender-only
 */
export const transferRequestsApi = {
  create(animalId: string, input: CreateTransferRequestInput): Promise<AnimalTransferRequest> {
    return apiClient.post<AnimalTransferRequest>(`/animals/${animalId}/transfer-requests`, input);
  },

  async listSent(page: number, pageSize: number): Promise<TransferRequestListPage> {
    return listPage('/animal-transfer-requests/sent', page, pageSize);
  },

  async listReceived(page: number, pageSize: number): Promise<TransferRequestListPage> {
    return listPage('/animal-transfer-requests/received', page, pageSize);
  },

  get(requestId: string): Promise<AnimalTransferRequest> {
    return apiClient.get<AnimalTransferRequest>(`/animal-transfer-requests/${requestId}`);
  },

  accept(requestId: string): Promise<AnimalTransferRequest> {
    return apiClient.post<AnimalTransferRequest>(`/animal-transfer-requests/${requestId}/accept`);
  },

  reject(requestId: string, reason?: string): Promise<AnimalTransferRequest> {
    return apiClient.post<AnimalTransferRequest>(`/animal-transfer-requests/${requestId}/reject`, {
      reason,
    });
  },

  cancel(requestId: string): Promise<AnimalTransferRequest> {
    return apiClient.post<AnimalTransferRequest>(`/animal-transfer-requests/${requestId}/cancel`);
  },
};

async function listPage(
  url: string,
  page: number,
  pageSize: number,
): Promise<TransferRequestListPage> {
  const envelope = await apiClient.requestEnvelope<AnimalTransferRequest[]>({
    method: 'GET',
    url,
    params: { page, pageSize },
  });
  const meta = (envelope.meta ?? {}) as Partial<PageMeta>;
  return {
    items: envelope.data,
    meta: {
      page: meta.page ?? page,
      pageSize: meta.pageSize ?? pageSize,
      total: meta.total ?? envelope.data.length,
      totalPages: meta.totalPages ?? 1,
    },
  };
}

export type TransferRequestsApi = typeof transferRequestsApi;
