import { ApiError } from '@/services/api';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { editorialAdminApi } from '../api';
import EditorialAdminFormScreen from '../screens/EditorialAdminFormScreen';
import type { EditorialItem } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const get = jest.spyOn(editorialAdminApi, 'get');
const removeCover = jest.spyOn(editorialAdminApi, 'removeCover');

const item = (over: Partial<EditorialItem> = {}): EditorialItem => ({
  id: 'n1',
  title: 'خبر',
  summary: null,
  status: 'DRAFT',
  coverImageUrl: 'https://cdn.example/cover.png',
  publishedAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

beforeEach(() => {
  resetRouterMock();
  get.mockReset();
  removeCover.mockReset();
  setSearchParams({ kind: 'news', itemId: 'n1' });
});
afterAll(() => jest.restoreAllMocks());

describe('EditorialAdminFormScreen — delete cover image', () => {
  it('calls the server delete, confirms, and refreshes to the empty cover field', async () => {
    get.mockResolvedValueOnce(item()).mockResolvedValue(item({ coverImageUrl: null }));
    removeCover.mockResolvedValue(item({ coverImageUrl: null }));
    renderWithProviders(<EditorialAdminFormScreen />);

    fireEvent.press(await screen.findByLabelText('remove'));
    await waitFor(() => expect(removeCover).toHaveBeenCalledWith('news', 'n1'));
    expect(await screen.findByText('تم حذف صورة الغلاف.')).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByLabelText('remove')).toBeNull());
    expect(get.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('a failed delete shows an error and keeps the image', async () => {
    get.mockResolvedValue(item());
    removeCover.mockRejectedValue(
      new ApiError({ status: 503, code: 'SERVICE_UNAVAILABLE', message: 'storage down' }),
    );
    renderWithProviders(<EditorialAdminFormScreen />);

    fireEvent.press(await screen.findByLabelText('remove'));
    await waitFor(() => expect(removeCover).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('تم حذف صورة الغلاف.')).toBeNull());
    expect(screen.getByLabelText('remove')).toBeOnTheScreen();
  });
});
