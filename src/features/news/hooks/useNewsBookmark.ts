import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { newsApi, newsKeys } from '../api';
import type { BookmarkResult, News, NewsListItem, NewsListPage } from '../types';

type Patch = Partial<Pick<NewsListItem, 'isBookmarked' | 'bookmarkCount'>>;

function applyToItem<T extends NewsListItem>(item: T, id: string, patch: Patch): T {
  return item.id === id ? { ...item, ...patch } : item;
}

/**
 * Optimistic bookmark toggle for a news item. Patches the detail, the featured
 * item and every cached list page in place; rolls back on error, then
 * reconciles with the server's authoritative count.
 */
export function useNewsBookmark() {
  const qc = useQueryClient();

  const patchCaches = (id: string, patch: Patch): (() => void) => {
    const snapshots: (() => void)[] = [];

    const detailKey = newsKeys.detail(id);
    const prevDetail = qc.getQueryData<News>(detailKey);
    if (prevDetail) {
      qc.setQueryData<News>(detailKey, { ...prevDetail, ...patch });
      snapshots.push(() => qc.setQueryData(detailKey, prevDetail));
    }

    const featuredKey = newsKeys.featured();
    const prevFeatured = qc.getQueryData<News | null>(featuredKey);
    if (prevFeatured && prevFeatured.id === id) {
      qc.setQueryData<News | null>(featuredKey, { ...prevFeatured, ...patch });
      snapshots.push(() => qc.setQueryData(featuredKey, prevFeatured));
    }

    const listCaches = qc.getQueriesData<InfiniteData<NewsListPage>>({
      queryKey: newsKeys.lists(),
    });
    for (const [key, data] of listCaches) {
      if (!data) continue;
      qc.setQueryData<InfiniteData<NewsListPage>>(key, {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map((it) => applyToItem(it, id, patch)),
        })),
      });
      snapshots.push(() => qc.setQueryData(key, data));
    }

    return () => snapshots.forEach((restore) => restore());
  };

  const bookmark = useMutation<
    BookmarkResult,
    unknown,
    { newsId: string; next: boolean; currentCount: number },
    { rollback: () => void }
  >({
    mutationFn: ({ newsId, next }) =>
      next ? newsApi.bookmark(newsId) : newsApi.unbookmark(newsId),
    onMutate: ({ newsId, next, currentCount }) => {
      const rollback = patchCaches(newsId, {
        isBookmarked: next,
        bookmarkCount: Math.max(0, currentCount + (next ? 1 : -1)),
      });
      return { rollback };
    },
    onSuccess: (res, { newsId }) => {
      patchCaches(newsId, { isBookmarked: res.isBookmarked, bookmarkCount: res.bookmarkCount });
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: (_d, _e, { newsId }) => {
      void qc.invalidateQueries({ queryKey: newsKeys.detail(newsId) });
    },
  });

  return {
    toggleBookmark: (newsId: string, next: boolean, currentCount: number) =>
      bookmark.mutate({ newsId, next, currentCount }),
    isBookmarking: bookmark.isPending,
  };
}
