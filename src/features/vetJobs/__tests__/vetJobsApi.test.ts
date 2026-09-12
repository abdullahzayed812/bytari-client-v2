import { apiClient } from '@/services/api';

import { vetJobsApi } from '../api';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const patch = jest.spyOn(apiClient, 'patch');
const del = jest.spyOn(apiClient, 'delete');

beforeEach(() => [envelope, get, post, patch, del].forEach((s) => s.mockReset()));
afterAll(() => jest.restoreAllMocks());

describe('vetJobsApi — offers', () => {
  it('listOffers → GET /vet-jobs/offers with filters', async () => {
    envelope.mockResolvedValueOnce({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    await vetJobsApi.listOffers({
      page: 1,
      pageSize: 20,
      search: 'طبيب',
      employmentType: 'FULL_TIME',
      governorate: 'بغداد',
    });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/vet-jobs/offers',
      params: { page: 1, pageSize: 20, search: 'طبيب', employmentType: 'FULL_TIME', governorate: 'بغداد' },
    });
  });

  it('listMyOffers → GET /vet-jobs/offers/mine', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    await vetJobsApi.listMyOffers({ page: 1, pageSize: 20 });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/vet-jobs/offers/mine',
      params: { page: 1, pageSize: 20 },
    });
  });

  it('getMyOffer → GET /vet-jobs/offers/:id/manage', async () => {
    get.mockResolvedValueOnce({});
    await vetJobsApi.getMyOffer('o1');
    expect(get).toHaveBeenCalledWith('/vet-jobs/offers/o1/manage');
  });

  it('createOffer → POST /vet-jobs/offers', async () => {
    post.mockResolvedValueOnce({});
    await vetJobsApi.createOffer({
      organizationName: 'مركز الحياة',
      title: 'طبيب بيطري',
      employmentType: 'FULL_TIME',
      governorate: 'بغداد',
      description: 'وصف الوظيفة',
      contactPhone: '0770',
    });
    expect(post).toHaveBeenCalledWith(
      '/vet-jobs/offers',
      expect.objectContaining({ title: 'طبيب بيطري' }),
    );
  });

  it('updateOffer → PATCH /vet-jobs/offers/:id', async () => {
    patch.mockResolvedValueOnce({});
    await vetJobsApi.updateOffer('o1', { title: 'محدث' });
    expect(patch).toHaveBeenCalledWith('/vet-jobs/offers/o1', { title: 'محدث' });
  });

  it('closeOffer → POST /vet-jobs/offers/:id/close', async () => {
    post.mockResolvedValueOnce({});
    await vetJobsApi.closeOffer('o1');
    expect(post).toHaveBeenCalledWith('/vet-jobs/offers/o1/close');
  });

  it('deleteOffer → DELETE /vet-jobs/offers/:id', async () => {
    del.mockResolvedValueOnce({});
    await vetJobsApi.deleteOffer('o1');
    expect(del).toHaveBeenCalledWith('/vet-jobs/offers/o1');
  });
});

describe('vetJobsApi — applications', () => {
  it('apply → POST /vet-jobs/offers/:id/applications', async () => {
    post.mockResolvedValueOnce({});
    await vetJobsApi.apply('o1', { fullName: 'د. أحمد', phone: '0770' });
    expect(post).toHaveBeenCalledWith(
      '/vet-jobs/offers/o1/applications',
      expect.objectContaining({ fullName: 'د. أحمد' }),
    );
  });

  it('acceptApplication → POST /vet-jobs/applications/:id/accept', async () => {
    post.mockResolvedValueOnce({});
    await vetJobsApi.acceptApplication('a1');
    expect(post).toHaveBeenCalledWith('/vet-jobs/applications/a1/accept');
  });

  it('rejectApplication → POST /vet-jobs/applications/:id/reject', async () => {
    post.mockResolvedValueOnce({});
    await vetJobsApi.rejectApplication('a1');
    expect(post).toHaveBeenCalledWith('/vet-jobs/applications/a1/reject');
  });
});

describe('vetJobsApi — seekers', () => {
  it('listSeekers → GET /vet-jobs/seekers with filters', async () => {
    envelope.mockResolvedValueOnce({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    await vetJobsApi.listSeekers({ page: 1, pageSize: 20, specialty: 'جراحة' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/vet-jobs/seekers',
      params: { page: 1, pageSize: 20, search: undefined, specialty: 'جراحة', governorate: undefined },
    });
  });

  it('createSeekerProfile → POST /vet-jobs/seekers', async () => {
    post.mockResolvedValueOnce({});
    await vetJobsApi.createSeekerProfile({ specialty: 'طب عام', governorate: 'بغداد', phone: '0770' });
    expect(post).toHaveBeenCalledWith(
      '/vet-jobs/seekers',
      expect.objectContaining({ specialty: 'طب عام' }),
    );
  });

  it('startConversationWithSeeker → POST /vet-jobs/seekers/:id/conversation', async () => {
    post.mockResolvedValueOnce({ conversationId: 'c1' });
    const res = await vetJobsApi.startConversationWithSeeker('s1');
    expect(post).toHaveBeenCalledWith('/vet-jobs/seekers/s1/conversation');
    expect(res.conversationId).toBe('c1');
  });
});
