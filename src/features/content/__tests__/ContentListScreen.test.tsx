import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { contentApi } from '../api';
import ContentListScreen from '../screens/ContentListScreen';
import type { ContentItem } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const list = jest.spyOn(contentApi, 'list');
const categories = jest.spyOn(contentApi, 'listCategories');

beforeEach(() => {
  resetRouterMock();
  list.mockReset();
  categories.mockReset().mockResolvedValue([]);
});
afterAll(() => jest.restoreAllMocks());

const item = (over: Partial<ContentItem> = {}): ContentItem => ({
  id: 'c1',
  type: 'MAGAZINE',
  title: 'مجلة الحيوان',
  description: null,
  body: null,
  authorName: null,
  publishedAt: null,
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

describe('ContentListScreen (§4, §7, §8, §29)', () => {
  it('scopes the list to the [type] slug (magazines → MAGAZINE)', async () => {
    setSearchParams({ type: 'magazines' });
    list.mockResolvedValue(page([item()]));
    renderWithProviders(<ContentListScreen />);
    await waitFor(() => expect(screen.getByText('مجلة الحيوان')).toBeOnTheScreen());
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ type: 'MAGAZINE' }));
  });

  it('an unknown [type] slug falls back to the all-content list (no type filter)', async () => {
    setSearchParams({ type: 'zines' });
    list.mockResolvedValue(page([item({ type: 'ARTICLE' })]));
    renderWithProviders(<ContentListScreen />);
    await waitFor(() => expect(screen.getByText('مجلة الحيوان')).toBeOnTheScreen());
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ type: undefined }));
  });

  it('shows the type-specific empty state', async () => {
    setSearchParams({ type: 'books' });
    list.mockResolvedValue(page([], 0));
    renderWithProviders(<ContentListScreen />);
    await waitFor(() => expect(screen.getByText('لا توجد كتب متاحة حاليًا')).toBeOnTheScreen());
  });

  it('tapping a card opens the content item', async () => {
    setSearchParams({ type: 'magazines' });
    list.mockResolvedValue(page([item()]));
    renderWithProviders(<ContentListScreen />);
    await waitFor(() => expect(screen.getByText('مجلة الحيوان')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('فتح مجلة الحيوان'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/content/item/c1');
  });
});
