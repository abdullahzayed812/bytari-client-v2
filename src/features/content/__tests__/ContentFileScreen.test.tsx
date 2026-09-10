import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { contentApi } from '../api';
import ContentFileScreen from '../screens/ContentFileScreen';
import type { ContentItem } from '../types';

const mockOpenURL = jest.fn();
const mockCanOpenURL = jest.fn();
jest.mock('expo-linking', () => ({
  canOpenURL: (u: string) => mockCanOpenURL(u),
  openURL: (u: string) => mockOpenURL(u),
}));

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getItem = jest.spyOn(contentApi, 'get');
const fileDownload = jest.spyOn(contentApi, 'fileDownload');

beforeEach(() => {
  resetRouterMock();
  getItem.mockReset();
  fileDownload.mockReset();
  mockOpenURL.mockReset().mockResolvedValue(undefined);
  mockCanOpenURL.mockReset().mockResolvedValue(true);
});
afterAll(() => jest.restoreAllMocks());

const withFiles = (files: ContentItem['files']): ContentItem => ({
  id: 'c1',
  type: 'BOOK',
  title: 'كتاب',
  description: null,
  body: null,
  authorName: null,
  publishedAt: null,
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
  files,
  createdAt: '',
  updatedAt: '',
});

describe('ContentFileScreen (§9, §10, §11, §34, §35)', () => {
  it('resolves the backend URL and opens a viewable PDF in the OS viewer', async () => {
    setSearchParams({ contentId: 'c1', fileId: 'f1' });
    getItem.mockResolvedValue(
      withFiles([
        {
          id: 'f1',
          kind: 'MAIN',
          originalFilename: 'book.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
        },
      ]),
    );
    fileDownload.mockResolvedValue({ url: 'https://cdn/book.pdf', expiresInSeconds: 300 });
    renderWithProviders(<ContentFileScreen />);

    await waitFor(() => expect(screen.getByText('book.pdf')).toBeOnTheScreen());
    expect(screen.getByText(/رابط الفتح مؤقت/)).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'فتح الملف' }));
    await waitFor(() => expect(mockOpenURL).toHaveBeenCalledWith('https://cdn/book.pdf'));
  });

  it('a non-viewable format shows the "open externally" affordance instead', async () => {
    setSearchParams({ contentId: 'c1', fileId: 'f2' });
    getItem.mockResolvedValue(
      withFiles([
        {
          id: 'f2',
          kind: 'ATTACHMENT',
          originalFilename: 'notes.txt',
          mimeType: 'text/plain',
          sizeBytes: 40,
        },
      ]),
    );
    fileDownload.mockResolvedValue({ url: 'https://cdn/notes.txt', expiresInSeconds: null });
    renderWithProviders(<ContentFileScreen />);
    await waitFor(() => expect(screen.getByText('notes.txt')).toBeOnTheScreen());
    expect(screen.getByRole('button', { name: 'فتح في تطبيق خارجي' })).toBeOnTheScreen();
  });

  it('a 404 on the download URL → file-unavailable state (no leak)', async () => {
    setSearchParams({ contentId: 'c1', fileId: 'x' });
    getItem.mockResolvedValue(
      withFiles([
        {
          id: 'x',
          kind: 'MAIN',
          originalFilename: 'a.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 10,
        },
      ]),
    );
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    fileDownload.mockRejectedValue(
      new ApiError({ code: 'NOT_FOUND', message: 'secret', status: 404 }),
    );
    renderWithProviders(<ContentFileScreen />);
    await waitFor(() => expect(screen.getByText('الملف غير متاح')).toBeOnTheScreen());
    expect(screen.queryByText('secret')).toBeNull();
  });
});
