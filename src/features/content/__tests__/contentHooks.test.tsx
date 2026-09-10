import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { contentApi, contentKeys } from '../api';
import { useContentFileUrl, useContentItem, useContentList } from '../hooks';
import type { ContentItem } from '../types';

afterEach(() => jest.restoreAllMocks());

const item: ContentItem = {
  id: 'c1',
  type: 'ARTICLE',
  title: 'x',
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
  files: [],
  createdAt: '',
  updatedAt: '',
};

describe('content hooks', () => {
  it('useContentList keys by the full filter set so Articles/Books/search never collide', () => {
    const a = contentKeys.list({ type: 'ARTICLE', pageSize: 20 });
    const b = contentKeys.list({ type: 'BOOK', pageSize: 20 });
    const c = contentKeys.list({ search: 'x', pageSize: 20 });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it('useContentList paginates through the backend meta', async () => {
    jest.spyOn(contentApi, 'list').mockResolvedValue({
      items: [item],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const { result } = renderHookWithQuery(() => useContentList({ type: 'ARTICLE' }));
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(false);
    expect(contentApi.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, type: 'ARTICLE' }),
    );
  });

  it('useContentItem does NOT retry a 404 (unpublished / unknown id)', async () => {
    const spy = jest
      .spyOn(contentApi, 'get')
      .mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 }));
    const { result } = renderHookWithQuery(() => useContentItem('missing'));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('useContentFileUrl is lazy — it does not fetch until enabled', async () => {
    const spy = jest.spyOn(contentApi, 'fileDownload').mockResolvedValue({
      url: 'https://cdn/x.pdf',
      expiresInSeconds: 300,
    });
    const client = makeTestQueryClient();
    const { rerender } = renderHookWithQuery(
      ({ on }: { on: boolean }) => useContentFileUrl('c1', 'f1', { enabled: on }),
      { client, initialProps: { on: false } },
    );
    expect(spy).not.toHaveBeenCalled();
    rerender({ on: true });
    await waitFor(() => expect(spy).toHaveBeenCalledWith('c1', 'f1'));
  });
});
