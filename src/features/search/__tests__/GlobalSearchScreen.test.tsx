import { apiClient } from '@/services/api';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { searchApi } from '../api/searchApi';
import GlobalSearchScreen, { searchHitHref } from '../screens/GlobalSearchScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

beforeEach(() => {
  resetRouterMock();
  jest.restoreAllMocks();
});

describe('searchApi', () => {
  it('calls GET /search with q, comma-joined types and limit', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ query: 'لقاح', groups: [] });
    await searchApi.search('لقاح', { types: ['BOOK', 'CLINIC'], limit: 3 });
    expect(get).toHaveBeenCalledWith('/search', { q: 'لقاح', types: 'BOOK,CLINIC', limit: 3 });
  });
});

describe('searchHitHref', () => {
  it('routes each result type to its existing detail screen', () => {
    const hit = { id: 'x1', title: 't', subtitle: null, imageUrl: null };
    expect(searchHitHref({ ...hit, type: 'CLINIC' })).toBe('/(app)/organizations/discover/x1');
    expect(searchHitHref({ ...hit, type: 'VETERINARY_OFFICE' })).toBe(
      '/(app)/veterinary-offices/x1',
    );
    expect(searchHitHref({ ...hit, type: 'FARM', meta: { farmSpecies: 'SHEEP' } })).toBe(
      '/(app)/livestock/sheep/x1',
    );
    expect(searchHitHref({ ...hit, type: 'BOOK' })).toBe('/(app)/veterinary-books/x1');
  });
});

describe('GlobalSearchScreen', () => {
  it('stays idle below two characters, then shows grouped backend results', async () => {
    const search = jest.spyOn(searchApi, 'search').mockResolvedValue({
      query: 'لقاح',
      groups: [
        {
          type: 'PET_STORE_PRODUCT',
          total: 1,
          items: [
            {
              type: 'PET_STORE_PRODUCT',
              id: 'p1',
              title: 'لقاح القطط',
              subtitle: null,
              imageUrl: null,
            },
          ],
        },
      ],
    });
    renderWithProviders(<GlobalSearchScreen />);
    const input = screen.getByLabelText('ابحث عن كتاب، منتج، عيادة، مكتب، مزرعة، خدمة…');
    fireEvent.changeText(input, 'ل');
    expect(search).not.toHaveBeenCalled();

    fireEvent.changeText(input, 'لقاح');
    expect(await screen.findByText('لقاح القطط')).toBeOnTheScreen();
    expect(screen.getByText('متجر أصحاب الحيوانات')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('لقاح القطط'));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith('/(app)/pet-owner-store/products/p1'),
    );
  });
});
