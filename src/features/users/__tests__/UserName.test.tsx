import { renderWithProviders, screen, waitFor } from '@/test-utils/render';

import { usersApi } from '../api';
import { UserName } from '../components';

const getSummary = jest.spyOn(usersApi, 'getSummary');

beforeEach(() => getSummary.mockReset());
afterAll(() => jest.restoreAllMocks());

describe('UserName', () => {
  it('renders the resolved name', async () => {
    getSummary.mockResolvedValue({
      id: 'u1',
      firstName: 'منى',
      lastName: 'عادل',
      veterinarianStatus: 'APPROVED',
      avatarUrl: null,
    });
    renderWithProviders(<UserName userId="u1" />);
    await waitFor(() => expect(screen.getByText('منى عادل')).toBeOnTheScreen());
    expect(getSummary).toHaveBeenCalledWith('u1');
  });

  it('renders the fallback for a null id and never calls the API', async () => {
    renderWithProviders(<UserName userId={null} fallback="—" />);
    expect(screen.getByText('—')).toBeOnTheScreen();
    expect(getSummary).not.toHaveBeenCalled();
  });

  it('renders the fallback (not a UUID) when the id cannot be resolved', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getSummary.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }));
    renderWithProviders(<UserName userId="u-missing" fallback="غير معروف" />);
    await waitFor(() => expect(screen.getByText('غير معروف')).toBeOnTheScreen());
    // never shows the raw id
    expect(screen.queryByText('u-missing')).toBeNull();
  });

  it('does not retry a 404', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getSummary.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }));
    renderWithProviders(<UserName userId="u1" />);
    await waitFor(() => expect(getSummary).toHaveBeenCalledTimes(1));
  });
});
