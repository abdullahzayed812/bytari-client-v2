import { apiClient } from '@/services/api';

import { adminContentApi } from '../api';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const patch = jest.spyOn(apiClient, 'patch');
const del = jest.spyOn(apiClient, 'delete');

beforeEach(() => {
  envelope.mockReset();
  get.mockReset();
  post.mockReset();
  patch.mockReset();
  del.mockReset();
});
afterAll(() => jest.restoreAllMocks());

const rawItem = {
  id: 'c1',
  type: 'BOOK',
  title: 'طب الحيوانات الداخلي',
  description: 'دليل شامل',
  body: null,
  authorName: 'د. أحمد',
  status: 'DRAFT',
  publishedAt: null,
  language: 'العربية',
  pageCount: 560,
  publishYear: 2023,
  likeCount: 0,
  commentCount: 0,
  viewCount: 0,
  rating: { average: null, count: 0 },
  categories: [{ id: 'cat1', slug: 'book-diseases', name: 'الأمراض', description: null }],
  files: [
    {
      id: 'f1',
      contentId: 'c1',
      kind: 'MAIN',
      storageKey: 'content/book/abc.pdf',
      storageProvider: 'r2',
      originalFilename: 'a.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
      checksum: null,
      uploadedByUserId: 'u1',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
  ],
  createdByUserId: 'u1',
  updatedByUserId: 'u1',
  deletedAt: null,
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-02T00:00:00.000Z',
};

describe('adminContentApi — /admin/content*, 1:1 with the backend', () => {
  it('list() GETs /admin/content and maps `search` → the `q` query param', async () => {
    envelope.mockResolvedValue({
      data: [rawItem],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const res = await adminContentApi.list({
      page: 1,
      pageSize: 20,
      type: 'BOOK',
      search: 'حيوانات',
    });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/admin/content',
      params: { page: 1, pageSize: 20, type: 'BOOK', status: undefined, categoryId: undefined, q: 'حيوانات' },
    });
    // Unlike the public mapper, the admin item KEEPS storageKey — it's never public.
    expect(res.items[0]).toMatchObject({
      id: 'c1',
      status: 'DRAFT',
      files: [expect.objectContaining({ storageKey: 'content/book/abc.pdf' })],
    });
  });

  it('create() POSTs /admin/content', async () => {
    post.mockResolvedValue(rawItem);
    const res = await adminContentApi.create({ type: 'BOOK', title: 'طب الحيوانات الداخلي' });
    expect(post).toHaveBeenCalledWith('/admin/content', { type: 'BOOK', title: 'طب الحيوانات الداخلي' });
    expect(res.id).toBe('c1');
  });

  it('publish() POSTs /admin/content/:id/publish', async () => {
    post.mockResolvedValue({ ...rawItem, status: 'PUBLISHED' });
    const res = await adminContentApi.publish('c1');
    expect(post).toHaveBeenCalledWith('/admin/content/c1/publish');
    expect(res.status).toBe('PUBLISHED');
  });

  it('deleteFile() DELETEs /admin/content/:id/files/:fileId', async () => {
    del.mockResolvedValue({ ...rawItem, files: [] });
    const res = await adminContentApi.deleteFile('c1', 'f1');
    expect(del).toHaveBeenCalledWith('/admin/content/c1/files/f1');
    expect(res.files).toHaveLength(0);
  });

  it('listCategories() GETs /admin/content-categories', async () => {
    get.mockResolvedValue([{ id: 'cat1', slug: 'book-diseases', name: 'الأمراض', description: null }]);
    const res = await adminContentApi.listCategories();
    expect(get).toHaveBeenCalledWith('/admin/content-categories');
    expect(res).toEqual([{ id: 'cat1', slug: 'book-diseases', name: 'الأمراض', description: null }]);
  });

  it('createCategory() POSTs /admin/content-categories', async () => {
    post.mockResolvedValue({ id: 'cat2', slug: 'book-new', name: 'جديد', description: null });
    const res = await adminContentApi.createCategory({ slug: 'book-new', name: 'جديد' });
    expect(post).toHaveBeenCalledWith('/admin/content-categories', { slug: 'book-new', name: 'جديد' });
    expect(res.slug).toBe('book-new');
  });

  it('updateCategory() PATCHes /admin/content-categories/:id', async () => {
    patch.mockResolvedValue({ id: 'cat1', slug: 'book-diseases', name: 'الأمراض المحدثة', description: null });
    const res = await adminContentApi.updateCategory('cat1', { name: 'الأمراض المحدثة' });
    expect(patch).toHaveBeenCalledWith('/admin/content-categories/cat1', { name: 'الأمراض المحدثة' });
    expect(res.name).toBe('الأمراض المحدثة');
  });
});
