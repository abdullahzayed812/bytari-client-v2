import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { adminContentApi } from '../api';
import AdminContentDetailScreen from '../screens/AdminContentDetailScreen';
import type { AdminContentFile, AdminContentItem } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const get = jest.spyOn(adminContentApi, 'get');
const download = jest.spyOn(adminContentApi, 'downloadFile');
const deleteFile = jest.spyOn(adminContentApi, 'deleteFile');

const cover: AdminContentFile = {
  id: 'f-cover',
  contentId: 'c1',
  kind: 'COVER',
  storageKey: 'content/books/x.png',
  storageProvider: 'r2',
  originalFilename: 'x.png',
  mimeType: 'image/png',
  sizeBytes: 100,
  checksum: null,
  uploadedByUserId: null,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const book = (files: AdminContentFile[]): AdminContentItem => ({
  id: 'c1',
  type: 'BOOK',
  title: 'كتاب',
  description: null,
  body: null,
  authorName: null,
  status: 'DRAFT',
  publishedAt: null,
  language: null,
  pageCount: null,
  publishYear: null,
  likeCount: 0,
  commentCount: 0,
  viewCount: 0,
  rating: { average: null, count: 0 } as never,
  categories: [],
  files,
  createdByUserId: null,
  updatedByUserId: null,
  deletedAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

beforeEach(() => {
  resetRouterMock();
  get.mockReset();
  download
    .mockReset()
    .mockResolvedValue({ url: 'https://cdn.example/x.png', expiresInSeconds: null });
  deleteFile.mockReset();
  setSearchParams({ type: 'BOOK', contentId: 'c1' });
});
afterAll(() => jest.restoreAllMocks());

describe('AdminContentDetailScreen — delete book cover', () => {
  it('deletes the COVER file on the server, confirms, and clears the preview', async () => {
    get.mockResolvedValueOnce(book([cover])).mockResolvedValue(book([]));
    deleteFile.mockResolvedValue(book([]));
    renderWithProviders(<AdminContentDetailScreen />);

    fireEvent.press(await screen.findByLabelText('remove'));
    await waitFor(() => expect(deleteFile).toHaveBeenCalledWith('c1', 'f-cover'));
    expect(await screen.findByText('تم حذف الملف.')).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByLabelText('remove')).toBeNull());
  });
});
