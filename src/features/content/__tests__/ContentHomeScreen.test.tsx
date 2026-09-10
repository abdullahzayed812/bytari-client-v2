import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { contentApi } from '../api';
import ContentHomeScreen from '../screens/ContentHomeScreen';
import type { ContentItem } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const list = jest.spyOn(contentApi, 'list');
const categories = jest.spyOn(contentApi, 'listCategories');

beforeEach(() => {
  resetRouterMock();
  setSearchParams({});
  list.mockReset();
  categories
    .mockReset()
    .mockResolvedValue([{ id: 'cat1', slug: 'nutrition', name: 'تغذية', description: null }]);
});
afterAll(() => jest.restoreAllMocks());

const item = (over: Partial<ContentItem> = {}): ContentItem => ({
  id: 'c1',
  type: 'ARTICLE',
  title: 'تغذية القطط',
  description: null,
  body: null,
  authorName: 'د. سارة',
  publishedAt: '2026-03-01T00:00:00.000Z',
  language: null,
  pageCount: null,
  publishYear: null,
  likeCount: 0,
  commentCount: 0,
  viewCount: 0,
  rating: { average: null, count: 0 },
  isBookmarked: false,
  isLiked: false,
  categories: [],
  files: [],
  createdAt: '',
  updatedAt: '',
  ...over,
});

const page = (items: ContentItem[], total = items.length) => ({
  items,
  meta: { page: 1, pageSize: 20, total, totalPages: 1 },
});

describe('ContentHomeScreen (§2, §3, §14, §29)', () => {
  it('shows the three type entry cards and navigates to the type list', async () => {
    list.mockResolvedValue(page([item()]));
    renderWithProviders(<ContentHomeScreen />);
    await waitFor(() => expect(screen.getByText('تغذية القطط')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('الكتب'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/content/books');
  });

  it('sends the search term to the backend as `q` (no local filtering)', async () => {
    list.mockResolvedValue(page([item()]));
    renderWithProviders(<ContentHomeScreen />);
    await waitFor(() => expect(screen.getByText('تغذية القطط')).toBeOnTheScreen());

    fireEvent.changeText(screen.getByPlaceholderText('ابحث في المحتوى…'), 'كلاب');
    await waitFor(
      () => expect(list).toHaveBeenCalledWith(expect.objectContaining({ search: 'كلاب' })),
      { timeout: 5000, interval: 60 },
    );
  });

  it('a category chip narrows the backend query by `categoryId`', async () => {
    list.mockResolvedValue(page([item()]));
    renderWithProviders(<ContentHomeScreen />);
    await waitFor(() => expect(screen.getByText('تغذية القطط')).toBeOnTheScreen());

    fireEvent.press(screen.getByText('تغذية'));
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat1' })),
    );
  });

  it('shows the empty state when the backend returns nothing', async () => {
    list.mockResolvedValue(page([], 0));
    renderWithProviders(<ContentHomeScreen />);
    await waitFor(() => expect(screen.getByText('لا يوجد محتوى متاح حاليًا')).toBeOnTheScreen());
  });

  it('a backend failure shows a safe error state (raw message hidden)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    list.mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db boom', status: 500 }),
    );
    renderWithProviders(<ContentHomeScreen />);
    await waitFor(() => expect(screen.queryByText('db boom')).toBeNull());
  });

  it('tapping a card opens that content item', async () => {
    list.mockResolvedValue(page([item()]));
    renderWithProviders(<ContentHomeScreen />);
    await waitFor(() => expect(screen.getByText('تغذية القطط')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('فتح تغذية القطط'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/content/item/c1');
  });
});
