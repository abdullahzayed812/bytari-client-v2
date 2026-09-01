import { apiClient } from '@/services/api';

import { usersApi } from '../api';

const get = jest.spyOn(apiClient, 'get');

beforeEach(() => get.mockReset());
afterAll(() => jest.restoreAllMocks());

describe('usersApi', () => {
  it('getSummary GETs /users/:id', async () => {
    get.mockResolvedValueOnce({
      id: 'u1',
      firstName: 'منى',
      lastName: 'عادل',
      veterinarianStatus: 'APPROVED',
    });
    const res = await usersApi.getSummary('u1');
    expect(get).toHaveBeenCalledWith('/users/u1');
    expect(res).toEqual({
      id: 'u1',
      firstName: 'منى',
      lastName: 'عادل',
      veterinarianStatus: 'APPROVED',
    });
  });
});
