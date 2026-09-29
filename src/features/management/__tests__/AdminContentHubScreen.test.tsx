import { adminContentApi } from '@/features/content/admin';
import type { AdminContentItem } from '@/features/content/admin';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test-utils/render';
import { expoRouter, resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import AdminContentHubScreen from '../screens/AdminContentHubScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function item(type: 'BOOK' | 'MAGAZINE', id: string, title: string): AdminContentItem {
  return {
    id,
    type,
    title,
    description: null,
    body: null,
    authorName: 'د. سامي',
    status: 'PUBLISHED',
    publishedAt: null,
    language: null,
    pageCount: null,
    publishYear: null,
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    rating: { average: 0, count: 0 },
    categories: [],
    files: [],
    createdByUserId: null,
    updatedByUserId: null,
    deletedAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  } as AdminContentItem;
}

let list: jest.SpyInstance;

beforeEach(() => {
  resetRouterMock();
  list = jest.spyOn(adminContentApi, 'list').mockImplementation(async (filter) => ({
    items:
      filter.type === 'MAGAZINE'
        ? [item('MAGAZINE', 'm1', 'مجلة الطب البيطري')]
        : [item('BOOK', 'b1', 'أساسيات الجراحة')],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  }));
});
afterEach(() => jest.restoreAllMocks());

describe('AdminContentHubScreen — combined Books & Magazines management', () => {
  it('opens on the Books tab and switches to Magazines through the existing content API', async () => {
    renderWithProviders(<AdminContentHubScreen />);

    expect(screen.getByText('إدارة الكتب والمجلات')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('أساسيات الجراحة')).toBeTruthy());
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ type: 'BOOK', page: 1 }));

    fireEvent.press(screen.getByRole('tab', { name: 'المجلات' }));
    await waitFor(() => expect(screen.getByText('مجلة الطب البيطري')).toBeTruthy());
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ type: 'MAGAZINE', page: 1 }));
    expect(screen.queryByText('أساسيات الجراحة')).toBeNull();
  });

  it('create / detail keep using the existing per-type routes of the active tab', async () => {
    renderWithProviders(<AdminContentHubScreen />);
    await waitFor(() => expect(screen.getByText('أساسيات الجراحة')).toBeTruthy());

    fireEvent.press(screen.getByText('أساسيات الجراحة'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/admin/veterinary-content/BOOK/b1');

    fireEvent.press(screen.getByRole('tab', { name: 'المجلات' }));
    fireEvent.press(screen.getByLabelText('إضافة'));
    expect(expoRouter.router.push).toHaveBeenCalledWith(
      '/(app)/admin/veterinary-content/MAGAZINE/create',
    );
  });

  it('a ?type=MAGAZINE deep link pre-selects the Magazines tab', async () => {
    setSearchParams({ type: 'MAGAZINE' });
    renderWithProviders(<AdminContentHubScreen />);
    await waitFor(() => expect(screen.getByText('مجلة الطب البيطري')).toBeTruthy());
    expect(list).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'BOOK' }));
  });

  it('keeps categories, tips and news reachable from the combined screen', () => {
    renderWithProviders(<AdminContentHubScreen />);

    fireEvent.press(screen.getByText('تصنيفات المجلة والكتب'));
    expect(expoRouter.router.push).toHaveBeenCalledWith(
      '/(app)/admin/veterinary-content/categories',
    );
    fireEvent.press(screen.getByText('إدارة النصائح'));
    fireEvent.press(screen.getByText('إدارة آخر الأخبار'));
    expect(expoRouter.router.push).toHaveBeenCalledTimes(3);
  });
});
