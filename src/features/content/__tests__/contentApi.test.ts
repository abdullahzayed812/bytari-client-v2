import { apiClient } from '@/services/api';

import { contentApi } from '../api';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');

beforeEach(() => {
  envelope.mockReset();
  get.mockReset();
});
afterAll(() => jest.restoreAllMocks());

/** A raw backend public payload — deliberately includes the moderation metadata. */
const rawItem = {
  id: 'c1',
  type: 'ARTICLE',
  title: 'تغذية القطط',
  description: 'ملخص',
  body: 'النص الكامل',
  authorName: 'د. سارة',
  status: 'PUBLISHED',
  publishedAt: '2026-03-01T00:00:00.000Z',
  categories: [{ id: 'cat1', slug: 'nutrition', name: 'تغذية', description: null }],
  files: [
    {
      id: 'f1',
      kind: 'MAIN',
      originalFilename: 'a.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 100,
      storageKey: 'SECRET/key',
      contentId: 'c1',
    },
  ],
  createdByUserId: 'u-secret',
  updatedByUserId: 'u-secret-2',
  deletedAt: null,
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-02T00:00:00.000Z',
};

describe('contentApi — public routes, 1:1 with the backend', () => {
  it('list() GETs /content and maps `search` → the `q` query param', async () => {
    envelope.mockResolvedValue({
      data: [rawItem],
      meta: { page: 2, pageSize: 20, total: 25, totalPages: 2 },
    });
    const res = await contentApi.list({
      page: 2,
      pageSize: 20,
      type: 'ARTICLE',
      categoryId: 'cat1',
      search: 'قطط',
    });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/content',
      params: { page: 2, pageSize: 20, type: 'ARTICLE', categoryId: 'cat1', q: 'قطط' },
    });
    expect(res.meta.total).toBe(25);
  });

  it('trims moderation / authorship metadata out of every item (§5, §17, §18)', async () => {
    envelope.mockResolvedValue({ data: [rawItem], meta: undefined } as never);
    const { items } = await contentApi.list({ page: 1, pageSize: 20 });
    const item = items[0]! as unknown as Record<string, unknown>;
    expect(item).not.toHaveProperty('status');
    expect(item).not.toHaveProperty('createdByUserId');
    expect(item).not.toHaveProperty('updatedByUserId');
    expect(item).not.toHaveProperty('deletedAt');
    // and the file loses its storage key / contentId
    const file = (item.files as Record<string, unknown>[])[0]!;
    expect(file).not.toHaveProperty('storageKey');
    expect(file).not.toHaveProperty('contentId');
    expect(file.id).toBe('f1');
  });

  it('list() tolerates a missing `meta` envelope', async () => {
    envelope.mockResolvedValue({ data: [rawItem] } as never);
    const res = await contentApi.list({ page: 1, pageSize: 20 });
    expect(res.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
  });

  it('get() / fileDownload() / listCategories() hit the right URLs', async () => {
    get.mockResolvedValueOnce(rawItem);
    await contentApi.get('c1');
    expect(get).toHaveBeenCalledWith('/content/c1');

    get.mockResolvedValueOnce({ url: 'https://cdn.example/x.pdf', expiresInSeconds: 300 });
    const dl = await contentApi.fileDownload('c1', 'f1');
    expect(get).toHaveBeenCalledWith('/content/c1/files/f1/download');
    expect(dl.url).toBe('https://cdn.example/x.pdf');

    get.mockResolvedValueOnce([
      { id: 'cat1', slug: 'nutrition', name: 'تغذية', description: null },
    ]);
    const cats = await contentApi.listCategories();
    expect(get).toHaveBeenCalledWith('/content-categories');
    expect(cats[0]!.name).toBe('تغذية');
  });
});
