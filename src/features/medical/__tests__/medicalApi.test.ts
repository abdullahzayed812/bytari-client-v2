import { apiClient } from '@/services/api';

import { medicalRecordsApi, vaccinationsApi } from '../api';

// File-scope spies + a single file-level afterAll (a per-describe
// `restoreAllMocks` would un-spy the client for the next describe block).
const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const patch = jest.spyOn(apiClient, 'patch');
const del = jest.spyOn(apiClient, 'delete');

beforeEach(() => {
  [envelope, get, post, patch, del].forEach((s) => s.mockReset());
});
afterAll(() => jest.restoreAllMocks());

describe('medicalRecordsApi — clinic + owner wrappers (mirror the backend routes exactly)', () => {
  it('listForClinic → GET /organizations/:orgId/animals/:animalId/medical-records with page/pageSize', async () => {
    envelope.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await medicalRecordsApi.listForClinic('o1', 'a1', 1, 20);
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organizations/o1/animals/a1/medical-records',
      params: { page: 1, pageSize: 20 },
    });
  });

  it('listForClinic → tolerates a missing meta block', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    const page = await medicalRecordsApi.listForClinic('o1', 'a1', 3, 10);
    expect(page.meta).toEqual({ page: 3, pageSize: 10, total: 0, totalPages: 1 });
  });

  it('getForClinic → GET .../medical-records/:recordId', async () => {
    get.mockResolvedValueOnce({ id: 'r1' });
    await medicalRecordsApi.getForClinic('o1', 'a1', 'r1');
    expect(get).toHaveBeenCalledWith('/organizations/o1/animals/a1/medical-records/r1');
  });

  it('create → POST .../medical-records (no organizationId / animalId / recordedByUserId in the body)', async () => {
    post.mockResolvedValueOnce({ id: 'r1' });
    await medicalRecordsApi.create('o1', 'a1', { diagnosis: 'x' });
    expect(post).toHaveBeenCalledWith('/organizations/o1/animals/a1/medical-records', {
      diagnosis: 'x',
    });
  });

  it('update → PATCH .../medical-records/:recordId', async () => {
    patch.mockResolvedValueOnce({ id: 'r1' });
    await medicalRecordsApi.update('o1', 'a1', 'r1', { notes: 'n' });
    expect(patch).toHaveBeenCalledWith('/organizations/o1/animals/a1/medical-records/r1', {
      notes: 'n',
    });
  });

  it('remove → DELETE .../medical-records/:recordId', async () => {
    del.mockResolvedValueOnce({ deleted: true });
    await medicalRecordsApi.remove('o1', 'a1', 'r1');
    expect(del).toHaveBeenCalledWith('/organizations/o1/animals/a1/medical-records/r1');
  });

  it('listForOwner → GET /animals/:animalId/medical-records (no organization segment)', async () => {
    envelope.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await medicalRecordsApi.listForOwner('a1', 1, 20);
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/animals/a1/medical-records',
      params: { page: 1, pageSize: 20 },
    });
  });

  it('getForOwner → GET /animals/:animalId/medical-records/:recordId', async () => {
    get.mockResolvedValueOnce({ id: 'r1' });
    await medicalRecordsApi.getForOwner('a1', 'r1');
    expect(get).toHaveBeenCalledWith('/animals/a1/medical-records/r1');
  });
});

describe('vaccinationsApi — clinic + owner wrappers', () => {
  it('listForClinic → GET /organizations/:orgId/animals/:animalId/vaccinations', async () => {
    envelope.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await vaccinationsApi.listForClinic('o1', 'a1', 1, 20);
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organizations/o1/animals/a1/vaccinations',
      params: { page: 1, pageSize: 20 },
    });
  });

  it('create → POST .../vaccinations with the form body only', async () => {
    post.mockResolvedValueOnce({ id: 'v1' });
    await vaccinationsApi.create('o1', 'a1', {
      vaccineName: 'Rabies',
      administeredOn: '2026-01-02',
    });
    expect(post).toHaveBeenCalledWith('/organizations/o1/animals/a1/vaccinations', {
      vaccineName: 'Rabies',
      administeredOn: '2026-01-02',
    });
  });

  it('update → PATCH .../vaccinations/:vaccinationId', async () => {
    patch.mockResolvedValueOnce({ id: 'v1' });
    await vaccinationsApi.update('o1', 'a1', 'v1', { nextDueOn: '2027-01-02' });
    expect(patch).toHaveBeenCalledWith('/organizations/o1/animals/a1/vaccinations/v1', {
      nextDueOn: '2027-01-02',
    });
  });

  it('remove → DELETE .../vaccinations/:vaccinationId', async () => {
    del.mockResolvedValueOnce({ deleted: true });
    await vaccinationsApi.remove('o1', 'a1', 'v1');
    expect(del).toHaveBeenCalledWith('/organizations/o1/animals/a1/vaccinations/v1');
  });

  it('listForOwner → GET /animals/:animalId/vaccinations', async () => {
    envelope.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await vaccinationsApi.listForOwner('a1', 1, 20);
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/animals/a1/vaccinations',
      params: { page: 1, pageSize: 20 },
    });
  });

  it('getForOwner → GET /animals/:animalId/vaccinations/:vaccinationId', async () => {
    get.mockResolvedValueOnce({ id: 'v1' });
    await vaccinationsApi.getForOwner('a1', 'v1');
    expect(get).toHaveBeenCalledWith('/animals/a1/vaccinations/v1');
  });
});
