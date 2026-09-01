import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { medicalKeys, medicalRecordsApi, vaccinationsApi } from '../api';
import {
  useCreateMedicalRecord,
  useCreateVaccination,
  useDeleteMedicalRecord,
  useDeleteVaccination,
  useUpdateMedicalRecord,
  useUpdateVaccination,
} from '../hooks';

describe('medical-record mutations (§33 — no optimistic updates; invalidate on success)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('create → POSTs the body then invalidates the animal records prefix', async () => {
    jest.spyOn(medicalRecordsApi, 'create').mockResolvedValueOnce({ id: 'r1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useCreateMedicalRecord('o1', 'a1'), { client });

    await result.current.mutateAsync({ diagnosis: 'x' });

    expect(medicalRecordsApi.create).toHaveBeenCalledWith('o1', 'a1', { diagnosis: 'x' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: medicalKeys.records('a1') });
  });

  it('update → PATCHes then invalidates the detail + the list prefix', async () => {
    jest.spyOn(medicalRecordsApi, 'update').mockResolvedValueOnce({ id: 'r1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useUpdateMedicalRecord('o1', 'a1'), { client });

    await result.current.mutateAsync({ recordId: 'r1', body: { notes: 'n' } });

    expect(medicalRecordsApi.update).toHaveBeenCalledWith('o1', 'a1', 'r1', { notes: 'n' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: medicalKeys.record('a1', 'r1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: medicalKeys.records('a1') });
  });

  it('delete → DELETEs then drops the detail + invalidates the list prefix', async () => {
    jest.spyOn(medicalRecordsApi, 'remove').mockResolvedValueOnce({ deleted: true });
    const client = makeTestQueryClient();
    const remove = jest.spyOn(client, 'removeQueries');
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useDeleteMedicalRecord('o1', 'a1'), { client });

    await result.current.mutateAsync({ recordId: 'r1' });

    expect(remove).toHaveBeenCalledWith({ queryKey: medicalKeys.record('a1', 'r1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: medicalKeys.records('a1') });
  });

  it('a backend 403 propagates as an ApiError (client never re-authorises)', async () => {
    jest
      .spyOn(medicalRecordsApi, 'create')
      .mockRejectedValueOnce(new ApiError({ code: 'FORBIDDEN', message: 'no', status: 403 }));
    const { result } = renderHookWithQuery(() => useCreateMedicalRecord('o1', 'a1'));
    await expect(result.current.mutateAsync({ diagnosis: 'x' })).rejects.toBeInstanceOf(ApiError);
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('vaccination mutations', () => {
  afterEach(() => jest.restoreAllMocks());

  it('create → POSTs then invalidates the animal vaccinations prefix', async () => {
    jest.spyOn(vaccinationsApi, 'create').mockResolvedValueOnce({ id: 'v1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useCreateVaccination('o1', 'a1'), { client });

    await result.current.mutateAsync({ vaccineName: 'Rabies', administeredOn: '2026-01-02' });

    expect(vaccinationsApi.create).toHaveBeenCalledWith('o1', 'a1', {
      vaccineName: 'Rabies',
      administeredOn: '2026-01-02',
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: medicalKeys.vaccinations('a1') });
  });

  it('update → PATCHes then invalidates the detail + list prefix', async () => {
    jest.spyOn(vaccinationsApi, 'update').mockResolvedValueOnce({ id: 'v1' } as never);
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useUpdateVaccination('o1', 'a1'), { client });

    await result.current.mutateAsync({ vaccinationId: 'v1', body: { notes: 'n' } });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: medicalKeys.vaccination('a1', 'v1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: medicalKeys.vaccinations('a1') });
  });

  it('delete → DELETEs then drops the detail', async () => {
    jest.spyOn(vaccinationsApi, 'remove').mockResolvedValueOnce({ deleted: true });
    const client = makeTestQueryClient();
    const remove = jest.spyOn(client, 'removeQueries');
    const { result } = renderHookWithQuery(() => useDeleteVaccination('o1', 'a1'), { client });

    await result.current.mutateAsync({ vaccinationId: 'v1' });

    expect(remove).toHaveBeenCalledWith({ queryKey: medicalKeys.vaccination('a1', 'v1') });
  });
});
