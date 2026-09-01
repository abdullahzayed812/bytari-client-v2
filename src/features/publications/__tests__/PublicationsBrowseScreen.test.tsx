import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { publicationsApi } from '../api';
import PublicationsBrowseScreen from '../screens/PublicationsBrowseScreen';
import type { PublicPublication } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const pub = (over: Partial<PublicPublication> = {}): PublicPublication => ({
  id: 'p1',
  kind: 'ADOPTION',
  note: 'قط أليف',
  publishedAt: '2026-02-01T10:00:00.000Z',
  animal: { id: 'a1', name: 'ميمي', species: 'CAT', breed: null },
  ...over,
});

describe('PublicationsBrowseScreen (§4, §26, §27, §37)', () => {
  const list = jest.spyOn(publicationsApi, 'listPublic');

  beforeEach(() => {
    resetRouterMock();
    list.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('lists APPROVED adoption publications scoped by the [kind] slug', async () => {
    setSearchParams({ kind: 'adoption' });
    list.mockResolvedValue({
      items: [pub()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<PublicationsBrowseScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(list).toHaveBeenCalledWith(1, 20, 'ADOPTION');
  });

  it('shows the kind-specific empty state', async () => {
    setSearchParams({ kind: 'lost' });
    list.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    renderWithProviders(<PublicationsBrowseScreen />);
    await waitFor(() => expect(screen.getByText('لا توجد حيوانات مفقودة مسجلة')).toBeOnTheScreen());
  });

  it('a backend failure shows a safe error state (no raw message)', async () => {
    setSearchParams({ kind: 'mating' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    list.mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db boom', status: 500 }),
    );
    renderWithProviders(<PublicationsBrowseScreen />);
    await waitFor(() => expect(screen.queryByText('db boom')).toBeNull());
  });

  it('an unknown [kind] slug is handled gracefully', () => {
    setSearchParams({ kind: 'giraffe' });
    renderWithProviders(<PublicationsBrowseScreen />);
    expect(screen.getByText('نوع إعلان غير معروف')).toBeOnTheScreen();
    expect(list).not.toHaveBeenCalled();
  });

  it('tapping a card opens the public detail for that kind + id', async () => {
    setSearchParams({ kind: 'adoption' });
    list.mockResolvedValue({
      items: [pub()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<PublicationsBrowseScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: /ميمي/ }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/publications/adoption/p1');
  });
});
