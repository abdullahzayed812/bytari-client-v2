import { apiClient } from '@/services/api';

import { publicationsApi } from '../api';
import type { CreateLostPublicationInput } from '../types';

// File-scope spies + one file-level afterAll (a per-describe restoreAllMocks
// would un-spy the client for the next describe block).
const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');

beforeEach(() => [envelope, get, post].forEach((s) => s.mockReset()));
afterAll(() => jest.restoreAllMocks());

const lostInput: CreateLostPublicationInput = {
  kind: 'LOST',
  note: 'last seen near the park',
  contactName: 'Test Contact',
  contactPhone: '07701234567',
  lostDate: '2026-01-01',
  lostGovernorate: 'Baghdad',
  lostDistrict: 'Karrada',
};

describe('publicationsApi — public browse (APPROVED, ALL users, never scoped to the caller)', () => {
  it('listPublic → GET /animal-publications with page/pageSize/kind/species/search', async () => {
    envelope.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await publicationsApi.listPublic(1, 20, { kind: 'ADOPTION' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/animal-publications',
      params: { page: 1, pageSize: 20, kind: 'ADOPTION', species: undefined, search: undefined },
    });
  });

  it('listPublic → tolerates a missing meta block', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    const page = await publicationsApi.listPublic(3, 10, { kind: 'LOST' });
    expect(page.meta).toEqual({ page: 3, pageSize: 10, total: 0, totalPages: 1 });
  });

  it('getPublic → GET /animal-publications/:id', async () => {
    get.mockResolvedValueOnce({ id: 'p1' });
    await publicationsApi.getPublic('p1');
    expect(get).toHaveBeenCalledWith('/animal-publications/p1');
  });

  it('createInteraction → POST /animal-publications/:id/interactions', async () => {
    post.mockResolvedValueOnce({ id: 'i1' });
    await publicationsApi.createInteraction('p1', { type: 'REQUEST' });
    expect(post).toHaveBeenCalledWith('/animal-publications/p1/interactions', { type: 'REQUEST' });
  });
});

describe('publicationsApi — owner-facing (per animal, every status)', () => {
  it('listForAnimal → GET /animals/:animalId/publications', async () => {
    envelope.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await publicationsApi.listForAnimal('a1', 1, 20);
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/animals/a1/publications',
      params: { page: 1, pageSize: 20 },
    });
  });

  it('getForAnimal → GET /animals/:animalId/publications/:publicationId', async () => {
    get.mockResolvedValueOnce({ id: 'p1' });
    await publicationsApi.getForAnimal('a1', 'p1');
    expect(get).toHaveBeenCalledWith('/animals/a1/publications/p1');
  });

  it('create → POST /animals/:animalId/publications with the full per-kind body', async () => {
    post.mockResolvedValueOnce({ id: 'p1' });
    await publicationsApi.create('a1', lostInput);
    expect(post).toHaveBeenCalledWith('/animals/a1/publications', lostInput);
  });
});
