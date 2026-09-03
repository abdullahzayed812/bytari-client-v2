import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { transferRequestKeys, transferRequestsApi, type TransferRequestListPage } from '../api';
import { petKeys } from '../api/queryKeys';
import type { AnimalTransferRequest, CreateTransferRequestInput } from '../types';

const PAGE_SIZE = 20;

/** Requests I (the current owner) sent — awaiting the recipient's response. */
export function useSentTransferRequests(options: { enabled?: boolean } = {}) {
  return useQuery<TransferRequestListPage, ApiError>({
    queryKey: transferRequestKeys.sent(1, PAGE_SIZE),
    queryFn: () => transferRequestsApi.listSent(1, PAGE_SIZE),
    enabled: options.enabled ?? true,
  });
}

/** Requests proposing me as the new owner — mine to accept or reject. */
export function useReceivedTransferRequests(options: { enabled?: boolean } = {}) {
  return useQuery<TransferRequestListPage, ApiError>({
    queryKey: transferRequestKeys.received(1, PAGE_SIZE),
    queryFn: () => transferRequestsApi.listReceived(1, PAGE_SIZE),
    enabled: options.enabled ?? true,
  });
}

export function useCreateTransferRequest(): UseMutationResult<
  AnimalTransferRequest,
  unknown,
  { animalId: string; input: CreateTransferRequestInput }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['pets', 'transfer-request', 'create'],
    mutationFn: ({ animalId, input }: { animalId: string; input: CreateTransferRequestInput }) =>
      transferRequestsApi.create(animalId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: transferRequestKeys.all });
    },
  });
}

/** Ownership actually moves on success — invalidate pet lists/detail too, not just the request lists. */
export function useAcceptTransferRequest(): UseMutationResult<
  AnimalTransferRequest,
  unknown,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['pets', 'transfer-request', 'accept'],
    mutationFn: (requestId: string) => transferRequestsApi.accept(requestId),
    onSuccess: (request) => {
      void qc.invalidateQueries({ queryKey: transferRequestKeys.all });
      void qc.invalidateQueries({ queryKey: petKeys.lists() });
      void qc.invalidateQueries({ queryKey: petKeys.detail(request.animal.id) });
      void qc.invalidateQueries({ queryKey: petKeys.ownership(request.animal.id) });
    },
  });
}

export function useRejectTransferRequest(): UseMutationResult<
  AnimalTransferRequest,
  unknown,
  { requestId: string; reason?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['pets', 'transfer-request', 'reject'],
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      transferRequestsApi.reject(requestId, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: transferRequestKeys.all });
    },
  });
}

export function useCancelTransferRequest(): UseMutationResult<
  AnimalTransferRequest,
  unknown,
  string
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['pets', 'transfer-request', 'cancel'],
    mutationFn: (requestId: string) => transferRequestsApi.cancel(requestId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: transferRequestKeys.all });
    },
  });
}
