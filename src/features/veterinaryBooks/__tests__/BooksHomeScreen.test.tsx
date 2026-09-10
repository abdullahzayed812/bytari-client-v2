import { Routes } from '@/constants/routes';
import { contentApi } from '@/features/content';
import type { ContentItem } from '@/features/content';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import BooksHomeScreen from '../screens/BooksHomeScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const list = jest.spyOn(contentApi, 'list');
const categories = jest.spyOn(contentApi, 'listCategories');

beforeEach(() => {
  resetRouterMock();
  setSearchParams({});
  list.mockReset();
  categories.mockReset().mockResolvedValue([
    { id: 'cat-diseases', slug: 'book-diseases', name: 'الأمراض', description: null },
  ]);
});
afterAll(() => jest.restoreAllMocks());

const book = (over: Partial<ContentItem> = {}): ContentItem => ({
  id: 'b1',
  type: 'BOOK',
  title: 'طب الحيوانات الداخلي الكلاب والقطط',
  description: 'دليل شامل للأطباء البيطريين',
  body: null,
  authorName: 'د. أحمد محمود الشافعي',
  publishedAt: '2026-03-01T00:00:00.000Z',
  language: 'العربية',
  pageCount: 560,
  publishYear: 2023,
  likeCount: 0,
  commentCount: 0,
  viewCount: 0,
  rating: { average: 4.5, count: 3 },
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

describe('BooksHomeScreen', () => {
  it('shows books and navigates to book detail on press', async () => {
    list.mockResolvedValue(page([book()]));
    renderWithProviders(<BooksHomeScreen />);

    await waitFor(() =>
      expect(screen.getAllByText('طب الحيوانات الداخلي الكلاب والقطط').length).toBeGreaterThan(0),
    );
    fireEvent.press(screen.getAllByLabelText('طب الحيوانات الداخلي الكلاب والقطط')[0]);
    expect(routerMock.push).toHaveBeenCalledWith(Routes.veterinaryBooksDetail('b1'));
  });

  it('navigates to a category chip', async () => {
    list.mockResolvedValue(page([]));
    renderWithProviders(<BooksHomeScreen />);

    await waitFor(() => expect(screen.getByLabelText('الأمراض')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('الأمراض'));
    expect(routerMock.push).toHaveBeenCalledWith(Routes.veterinaryBooksCategory('cat-diseases'));
  });
});
