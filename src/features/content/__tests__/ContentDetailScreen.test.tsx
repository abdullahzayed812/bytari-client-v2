import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { contentApi } from '../api';
import ContentDetailScreen from '../screens/ContentDetailScreen';
import type { ContentItem } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getItem = jest.spyOn(contentApi, 'get');
const fileDownload = jest.spyOn(contentApi, 'fileDownload');

beforeEach(() => {
  resetRouterMock();
  getItem.mockReset();
  fileDownload.mockReset();
});
afterAll(() => jest.restoreAllMocks());

const item = (over: Partial<ContentItem> = {}): ContentItem => ({
  id: 'c1',
  type: 'ARTICLE',
  title: 'تغذية القطط',
  description: 'ملخص المقال',
  body: 'النص الكامل للمقال',
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
  categories: [{ id: 'cat1', slug: 'nutrition', name: 'تغذية', description: null }],
  files: [],
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('ContentDetailScreen (§5, §6, §17, §18)', () => {
  it('renders title, description, body and categories', async () => {
    setSearchParams({ contentId: 'c1' });
    getItem.mockResolvedValue(item());
    renderWithProviders(<ContentDetailScreen />);
    await waitFor(() => expect(screen.getByText('ملخص المقال')).toBeOnTheScreen());
    expect(screen.getByText('النص الكامل للمقال')).toBeOnTheScreen();
    expect(screen.getByText('تغذية')).toBeOnTheScreen();
    expect(screen.getByText('بقلم د. سارة')).toBeOnTheScreen();
  });

  it('renders a body containing markup as LITERAL TEXT — no HTML/JS execution (§6, §33)', async () => {
    setSearchParams({ contentId: 'c1' });
    const evil = '<script>alert(1)</script> <b>bold</b> https://ok.example/x';
    getItem.mockResolvedValue(item({ body: evil }));
    renderWithProviders(<ContentDetailScreen />);
    // the exact string is shown verbatim (React Native <Text> never parses it)
    await waitFor(() => expect(screen.getByText(evil)).toBeOnTheScreen());
    // the bare URL is surfaced as a tappable link entry
    expect(screen.getByLabelText('فتح الرابط https://ok.example/x')).toBeOnTheScreen();
  });

  it('a 404 (unpublished / archived / deleted / invalid id) → neutral not-found, no leak', async () => {
    setSearchParams({ contentId: 'x' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getItem.mockRejectedValue(
      new ApiError({ code: 'NOT_FOUND', message: 'draft secret', status: 404 }),
    );
    renderWithProviders(<ContentDetailScreen />);
    await waitFor(() => expect(screen.getByText('المحتوى غير متاح')).toBeOnTheScreen());
    expect(screen.queryByText('draft secret')).toBeNull();
  });

  it('lists document files and opens the file reader; a COVER file is not listed', async () => {
    setSearchParams({ contentId: 'c1' });
    getItem.mockResolvedValue(
      item({
        files: [
          {
            id: 'cov',
            kind: 'COVER',
            originalFilename: 'cover.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 10,
          },
          {
            id: 'doc',
            kind: 'MAIN',
            originalFilename: 'article.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 2048,
          },
        ],
      }),
    );
    fileDownload.mockResolvedValue({ url: 'https://cdn/cover.jpg', expiresInSeconds: null });
    renderWithProviders(<ContentDetailScreen />);
    await waitFor(() => expect(screen.getByText('article.pdf')).toBeOnTheScreen());
    expect(screen.queryByText('cover.jpg')).toBeNull();
    fireEvent.press(screen.getByLabelText('فتح article.pdf'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/content/item/c1/files/doc');
  });
});
