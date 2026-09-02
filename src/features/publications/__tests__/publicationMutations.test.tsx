import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { publicationKeys, publicationsApi } from '../api';
import { useCreatePublication, useCreatePublicationInteraction } from '../hooks';
import type { CreateAdoptionPublicationInput, CreateLostPublicationInput } from '../types';

const adoptionInput: CreateAdoptionPublicationInput = {
  kind: 'ADOPTION',
  note: 'friendly cat',
  contactName: 'Test Contact',
  contactPhone: '07701234567',
  city: 'Baghdad',
  healthStatus: 'GOOD',
  vaccinationStatus: 'COMPLETE',
  isSterilized: false,
};

const lostInput: CreateLostPublicationInput = {
  kind: 'LOST',
  contactName: 'Test Contact',
  contactPhone: '07701234567',
  lostDate: '2026-01-01',
  lostGovernorate: 'Baghdad',
  lostDistrict: 'Karrada',
};

describe('useCreatePublication (§29 — no optimistic updates; approval workflow respected)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('POSTs the full per-kind body for the route animal then invalidates the owner + public lists', async () => {
    jest
      .spyOn(publicationsApi, 'create')
      .mockResolvedValueOnce({ id: 'p1', kind: 'ADOPTION', status: 'PENDING' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useCreatePublication('a1'), { client });

    await result.current.mutateAsync(adoptionInput);

    expect(publicationsApi.create).toHaveBeenCalledWith('a1', adoptionInput);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: publicationKeys.forAnimal('a1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: publicationKeys.publicList('ADOPTION') });
  });

  it('a backend 404 (non-owned animal) propagates as an ApiError — never swallowed', async () => {
    jest
      .spyOn(publicationsApi, 'create')
      .mockRejectedValueOnce(new ApiError({ code: 'NOT_FOUND', message: 'no', status: 404 }));
    const { result } = renderHookWithQuery(() => useCreatePublication('a1'));
    await expect(result.current.mutateAsync(lostInput)).rejects.toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreatePublicationInteraction — "طلب" / "ابلاغ عن مشاهدة"', () => {
  afterEach(() => jest.restoreAllMocks());

  it('POSTs the interaction for the given publication', async () => {
    jest.spyOn(publicationsApi, 'createInteraction').mockResolvedValueOnce({
      id: 'i1',
      publicationId: 'p1',
      type: 'REQUEST',
      requesterUserId: 'u1',
      message: null,
      createdAt: '',
    });
    const { result } = renderHookWithQuery(() => useCreatePublicationInteraction('p1'));

    await result.current.mutateAsync({ type: 'REQUEST' });

    expect(publicationsApi.createInteraction).toHaveBeenCalledWith('p1', { type: 'REQUEST' });
  });

  it('a 403 (own listing) propagates as an ApiError', async () => {
    jest
      .spyOn(publicationsApi, 'createInteraction')
      .mockRejectedValueOnce(
        new ApiError({ code: 'PERMISSION_DENIED', message: 'no', status: 403 }),
      );
    const { result } = renderHookWithQuery(() => useCreatePublicationInteraction('p1'));
    await expect(result.current.mutateAsync({ type: 'SIGHTING' })).rejects.toBeInstanceOf(ApiError);
  });
});
