import { cleanup, fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { tipsApi } from '../api';
import TipDetailScreen from '../screens/TipDetailScreen';
import TipsListScreen from '../screens/TipsListScreen';
import type { Tip, TipListItem } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const list = jest.spyOn(tipsApi, 'list');
const tod = jest.spyOn(tipsApi, 'tipOfTheDay');
const bookmark = jest.spyOn(tipsApi, 'bookmark');
const get = jest.spyOn(tipsApi, 'get');
const helpful = jest.spyOn(tipsApi, 'markHelpful');

beforeEach(() => {
  resetRouterMock();
  list.mockReset();
  tod.mockReset().mockResolvedValue(null);
  bookmark.mockReset().mockResolvedValue({ isBookmarked: true });
  get.mockReset();
  helpful.mockReset().mockResolvedValue({ isHelpful: true, helpfulCount: 1 });
});
afterEach(() => cleanup());
afterAll(() => jest.restoreAllMocks());

const listItem = (over: Partial<TipListItem> = {}): TipListItem => ({
  id: 't1',
  title: 'أفضل طرق تغذية الأغنام في الصيف',
  summary: 'تغذية متوازنة للطاقة والماء والمعادن.',
  readMinutes: 5,
  priority: 'IMPORTANT',
  isTipOfDay: false,
  category: { id: 'c1', slug: 'nutrition', name: 'التغذية' },
  coverImageUrl: null,
  helpfulCount: 0,
  isBookmarked: false,
  isHelpful: false,
  publishedAt: '2026-08-01T00:00:00.000Z',
  ...over,
});

const fullTip = (over: Partial<Tip> = {}): Tip => ({
  ...listItem(),
  bodyIntro: 'في فصل الصيف تحتاج الأغنام إلى تغذية متوازنة.',
  keyPoints: ['وفر علفاً غنياً بالألياف.', 'قدّم العلف في الصباح الباكر.'],
  warningPoints: ['فقدان الشهية.'],
  vetAdvice: 'استشر الطبيب البيطري إذا استمرت الأعراض.',
  updatedAt: '2026-08-20T00:00:00.000Z',
  ...over,
});

describe('TipsListScreen', () => {
  it('renders the featured tip and the grid, and opens a tip', async () => {
    tod.mockResolvedValue(
      fullTip({ id: 'featured', title: 'نصيحة اليوم المميزة', isTipOfDay: true }),
    );
    list.mockResolvedValue({
      items: [
        listItem({ id: 't1', title: 'نصيحة أولى' }),
        listItem({ id: 't2', title: 'نصيحة ثانية' }),
      ],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    renderWithProviders(<TipsListScreen />);

    await waitFor(() => expect(screen.getByText('نصيحة أولى')).toBeOnTheScreen());
    expect(screen.getByText('نصيحة ثانية')).toBeOnTheScreen();
    expect(screen.getByText('نصيحة اليوم المميزة')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'فتح نصيحة أولى' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/tips/t1');
  });

  it('the card bookmark control calls the API', async () => {
    list.mockResolvedValue({
      items: [listItem({ id: 't1', title: 'نصيحة', isBookmarked: false })],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<TipsListScreen />);
    await waitFor(() => expect(screen.getByText('نصيحة')).toBeOnTheScreen());

    const saveBtn = screen
      .getAllByRole('button')
      .find((b) => b.props.accessibilityLabel === 'حفظ النصيحة');
    fireEvent.press(saveBtn as Parameters<typeof fireEvent.press>[0]);
    await waitFor(() => expect(bookmark).toHaveBeenCalledWith('t1'));
  });

  it('shows the empty state', async () => {
    list.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    renderWithProviders(<TipsListScreen />);
    await waitFor(() => expect(screen.getByText('لا توجد نصائح بعد')).toBeOnTheScreen());
  });
});

describe('TipDetailScreen', () => {
  beforeEach(() => setSearchParams({ tipId: 't1' }));

  it('renders every section and toggles "helpful"', async () => {
    get.mockResolvedValue(fullTip());
    renderWithProviders(<TipDetailScreen />);

    await waitFor(() =>
      expect(screen.getByText('أفضل طرق تغذية الأغنام في الصيف')).toBeOnTheScreen(),
    );
    expect(screen.getByText('النقاط المهمة')).toBeOnTheScreen();
    expect(screen.getByText('متى تقلق؟')).toBeOnTheScreen();
    expect(screen.getByText('متى تحتاج لطبيب بيطري؟')).toBeOnTheScreen();
    expect(screen.getByText('وفر علفاً غنياً بالألياف.')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'مفيدة' }));
    await waitFor(() => expect(helpful).toHaveBeenCalledWith('t1'));
  });

  it('shows a not-found state on 404', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    get.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }));
    renderWithProviders(<TipDetailScreen />);
    await waitFor(() => expect(screen.getByText('النصيحة غير متاحة')).toBeOnTheScreen());
  });
});
