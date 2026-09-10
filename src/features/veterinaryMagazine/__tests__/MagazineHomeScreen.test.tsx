import { Routes } from '@/constants/routes';
import { contentApi } from '@/features/content';
import type { ContentItem } from '@/features/content';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import MagazineHomeScreen from '../screens/MagazineHomeScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const list = jest.spyOn(contentApi, 'list');
const categories = jest.spyOn(contentApi, 'listCategories');

beforeEach(() => {
  resetRouterMock();
  setSearchParams({});
  list.mockReset();
  categories.mockReset().mockResolvedValue([
    { id: 'cat-poultry', slug: 'mag-poultry', name: 'دواجن', description: null },
  ]);
});
afterAll(() => jest.restoreAllMocks());

const article = (over: Partial<ContentItem> = {}): ContentItem => ({
  id: 'a1',
  type: 'MAGAZINE',
  title: 'أهمية التحصينات الدورية',
  description: null,
  body: null,
  authorName: 'د. سارة محمود',
  publishedAt: '2026-03-01T00:00:00.000Z',
  language: null,
  pageCount: null,
  publishYear: null,
  likeCount: 2,
  commentCount: 1,
  viewCount: 10,
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

describe('MagazineHomeScreen', () => {
  it('shows the latest-articles rail and navigates to article detail on press', async () => {
    list.mockResolvedValue(page([article()]));
    renderWithProviders(<MagazineHomeScreen />);

    await waitFor(() =>
      expect(screen.getAllByText('أهمية التحصينات الدورية').length).toBeGreaterThan(0),
    );
    fireEvent.press(screen.getAllByLabelText('أهمية التحصينات الدورية')[0]);
    expect(routerMock.push).toHaveBeenCalledWith(Routes.veterinaryMagazineArticle('a1'));
  });

  it('navigates to a category chip', async () => {
    list.mockResolvedValue(page([]));
    renderWithProviders(<MagazineHomeScreen />);

    await waitFor(() => expect(screen.getByLabelText('دواجن')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('دواجن'));
    expect(routerMock.push).toHaveBeenCalledWith(Routes.veterinaryMagazineCategory('cat-poultry'));
  });
});
