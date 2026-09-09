import { apiClient } from '@/services/api';

import { vetServicesApi } from '../api';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const del = jest.spyOn(apiClient, 'delete');

beforeEach(() => [envelope, get, post, del].forEach((s) => s.mockReset()));
afterAll(() => jest.restoreAllMocks());

describe('vetServicesApi — listings', () => {
  it('listListings → GET /vet-services/listings with filters', async () => {
    envelope.mockResolvedValueOnce({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    await vetServicesApi.listListings({ page: 2, pageSize: 20, serviceType: 'VACCINATION', animalType: 'DOG', governorate: 'بغداد' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/vet-services/listings',
      params: {
        page: 2,
        pageSize: 20,
        search: undefined,
        serviceType: 'VACCINATION',
        animalType: 'DOG',
        governorate: 'بغداد',
        minPrice: undefined,
        maxPrice: undefined,
      },
    });
  });

  it('listMyListings → GET /vet-services/listings/mine', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    const page = await vetServicesApi.listMyListings({ page: 1, pageSize: 20 });
    expect(envelope).toHaveBeenCalledWith({ method: 'GET', url: '/vet-services/listings/mine', params: { page: 1, pageSize: 20 } });
    expect(page.meta).toEqual({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  });

  it('getMyListing → GET /vet-services/listings/:id/manage', async () => {
    get.mockResolvedValueOnce({ id: 'l1' });
    await vetServicesApi.getMyListing('l1');
    expect(get).toHaveBeenCalledWith('/vet-services/listings/l1/manage');
  });

  it('closeListing / deleteListing hit the dedicated endpoints', async () => {
    post.mockResolvedValueOnce({ id: 'l1' });
    await vetServicesApi.closeListing('l1');
    expect(post).toHaveBeenCalledWith('/vet-services/listings/l1/close');

    del.mockResolvedValueOnce(undefined);
    await vetServicesApi.deleteListing('l1');
    expect(del).toHaveBeenCalledWith('/vet-services/listings/l1');
  });

  it('startListingConversation → POST /vet-services/listings/:id/conversation', async () => {
    post.mockResolvedValueOnce({ conversationId: 'c1' });
    await vetServicesApi.startListingConversation('l1');
    expect(post).toHaveBeenCalledWith('/vet-services/listings/l1/conversation');
  });
});

describe('vetServicesApi — engagements', () => {
  it('createOffer → POST /vet-services/requests/:id/offers', async () => {
    post.mockResolvedValueOnce({ id: 'o1' });
    await vetServicesApi.createOffer('r1', { proposedAmount: '150000' });
    expect(post).toHaveBeenCalledWith('/vet-services/requests/r1/offers', { proposedAmount: '150000' });
  });

  it('offerAction → POST /vet-services/offers/:id/:action', async () => {
    post.mockResolvedValue({ id: 'o1' });
    await vetServicesApi.offerAction('o1', 'accept');
    expect(post).toHaveBeenCalledWith('/vet-services/offers/o1/accept');
    await vetServicesApi.offerAction('o1', 'complete');
    expect(post).toHaveBeenCalledWith('/vet-services/offers/o1/complete');
  });

  it('createListingRequest → POST /vet-services/listings/:id/requests', async () => {
    post.mockResolvedValueOnce({ id: 'lr1' });
    await vetServicesApi.createListingRequest('l1', { animalType: 'CAT' });
    expect(post).toHaveBeenCalledWith('/vet-services/listings/l1/requests', { animalType: 'CAT' });
  });

  it('listReceivedListingRequests → GET /vet-services/listing-requests/received', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    await vetServicesApi.listReceivedListingRequests({ page: 1, pageSize: 20 });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/vet-services/listing-requests/received',
      params: { page: 1, pageSize: 20 },
    });
  });

  it('listingRequestAction → POST /vet-services/listing-requests/:id/:action', async () => {
    post.mockResolvedValueOnce({ id: 'lr1' });
    await vetServicesApi.listingRequestAction('lr1', 'cancel');
    expect(post).toHaveBeenCalledWith('/vet-services/listing-requests/lr1/cancel');
  });
});
