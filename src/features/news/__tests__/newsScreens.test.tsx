import { cleanup, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { newsApi } from '../api';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import NewsListScreen from '../screens/NewsListScreen';
import type { News, NewsListItem } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const list = jest.spyOn(newsApi, 'list');
const featured = jest.spyOn(newsApi, 'featured');
const get = jest.spyOn(newsApi, 'get');
const bookmark = jest.spyOn(newsApi, 'bookmark');

beforeEach(() => {
  resetRouterMock();
  list.mockReset();
  featured.mockReset().mockResolvedValue(null);
  get.mockReset();
  bookmark.mockReset().mockResolvedValue({ isBookmarked: true, bookmarkCount: 1 });
});
afterEach(() => cleanup());
afterAll(() => jest.restoreAllMocks());

const listItem = (over: Partial<NewsListItem> = {}): NewsListItem => ({
  id: 'n1',
  title: 'ارتفاع أسعار البيض في أغلب المحافظات اليوم',
  summary: 'ملخص الخبر',
  source: 'وزارة الزراعة',
  isFeatured: false,
  tag: 'NORMAL',
  category: { id: 'c1', slug: 'prices-markets', name: 'الأسعار والأسواق' },
  coverImageUrl: null,
  bookmarkCount: 0,
  isBookmarked: false,
  publishedAt: '2024-05-18T00:00:00.000Z',
  ...over,
});

const detail = (over: Partial<News> = {}): News => ({
  ...listItem(),
  body: 'نص الخبر الكامل',
  reasonPoints: ['ارتفاع أسعار الأعلاف', 'زيادة الطلب الموسمي'],
  advicePoints: ['إدارة تكاليف الأعلاف'],
  alertNote: 'تنبيه مهم للمربين',
  galleryUrls: [],
  updatedAt: '2024-05-18T00:00:00.000Z',
  ...over,
});

describe('NewsListScreen', () => {
  it('renders the featured hero and the news grid', async () => {
    featured.mockResolvedValue(
      detail({ id: 'f1', isFeatured: true, title: 'الخبر المميز لهذا اليوم' }),
    );
    list.mockResolvedValue({
      items: [listItem(), listItem({ id: 'n2', title: 'خبر آخر', tag: 'URGENT' })],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });

    renderWithProviders(<NewsListScreen />);

    expect(await screen.findByText('الخبر المميز لهذا اليوم')).toBeTruthy();
    expect(await screen.findByText('ارتفاع أسعار البيض في أغلب المحافظات اليوم')).toBeTruthy();
    expect(await screen.findByText('عاجل')).toBeTruthy();
  });

  it('shows the empty state when there is no news', async () => {
    list.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    renderWithProviders(<NewsListScreen />);
    expect(await screen.findByText('لا توجد أخبار بعد')).toBeTruthy();
  });
});

describe('NewsDetailScreen', () => {
  it('renders the article sections and the reasons/advice bullets', async () => {
    setSearchParams({ newsId: 'n1' });
    get.mockResolvedValue(detail());

    renderWithProviders(<NewsDetailScreen />);

    expect(await screen.findByText('ارتفاع أسعار البيض في أغلب المحافظات اليوم')).toBeTruthy();
    expect(await screen.findByText('الأسباب')).toBeTruthy();
    expect(await screen.findByText('ارتفاع أسعار الأعلاف')).toBeTruthy();
    expect(await screen.findByText('تنبيه مهم للمربين')).toBeTruthy();
  });

  it('turns a 404 into a plain "unavailable" state', async () => {
    setSearchParams({ newsId: 'missing' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    get.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'not found', status: 404 }));

    renderWithProviders(<NewsDetailScreen />);
    await waitFor(() => expect(screen.getByText('الخبر غير متاح')).toBeOnTheScreen());
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
