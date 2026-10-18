import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { publicationsApi } from '../api';
import PublicationsBrowseScreen from '../screens/PublicationsBrowseScreen';
import type { MyPublicationInteraction } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const interaction = (over: Partial<MyPublicationInteraction> = {}): MyPublicationInteraction => ({
  id: 'i1',
  publicationId: 'p1',
  type: 'REQUEST',
  requesterUserId: 'u1',
  message: 'I want to adopt',
  conversationId: 'c1',
  createdAt: '2026-10-06T12:40:09.915Z',
  publication: {
    id: 'p1',
    kind: 'ADOPTION',
    status: 'APPROVED',
    resolution: null,
    animalName: 'Luna',
  },
  ...over,
});

describe('PublicationsBrowseScreen — "طلباتي" (my requests)', () => {
  const pub = jest.spyOn(publicationsApi, 'listPublic');
  const mine = jest.spyOn(publicationsApi, 'listMyInteractions');

  beforeEach(() => {
    resetRouterMock();
    pub.mockReset().mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    mine.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it.each([
    ['adoption', 'ADOPTION'],
    ['mating', 'MATING'],
    ['lost', 'LOST'],
  ] as const)('%s: loads my requests and opens the listing / chat', async (slug, kind) => {
    setSearchParams({ kind: slug });
    mine.mockResolvedValue({
      items: [
        interaction({
          type: kind === 'LOST' ? 'SIGHTING' : 'REQUEST',
          publication: { id: 'p1', kind, status: 'APPROVED', resolution: null, animalName: 'Luna' },
        }),
      ],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<PublicationsBrowseScreen />);
    fireEvent.press(screen.getByText('طلباتي'));
    await waitFor(() => expect(screen.getByText('Luna')).toBeOnTheScreen());
    expect(mine).toHaveBeenCalledWith(1, 20, { kind });
    fireEvent.press(screen.getByText('عرض الإعلان'));
    expect(routerMock.push).toHaveBeenCalledWith(`/(app)/publications/${slug}/p1`);
  });

  it('shows an empty state (not an endless spinner) when there are no requests', async () => {
    setSearchParams({ kind: 'adoption' });
    mine.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    renderWithProviders(<PublicationsBrowseScreen />);
    fireEvent.press(screen.getByText('طلباتي'));
    await waitFor(() => expect(mine).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
  });

  it.each(['adoption', 'mating', 'lost'] as const)(
    '%s: switching from the rendered 2-column grid to "طلباتي" and back does not crash',
    async (slug) => {
      // Regression: both lists sat in one slot, so React reused the FlatList and
      // flipped numColumns 2 → 1 — an invariant error that closed the app.
      setSearchParams({ kind: slug });
      mine.mockResolvedValue({
        items: [interaction()],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      });
      renderWithProviders(<PublicationsBrowseScreen />);
      // wait for the "الكل" grid itself (not the loading skeleton)
      await waitFor(() => expect(pub).toHaveBeenCalled());
      await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
      await screen.findByText(/لا توجد/);
      fireEvent.press(screen.getByText('طلباتي'));
      await waitFor(() => expect(screen.getByText('Luna')).toBeOnTheScreen());
      fireEvent.press(screen.getByText('الكل'));
      await waitFor(() => expect(screen.queryByText('Luna')).toBeNull());
    },
  );
});
