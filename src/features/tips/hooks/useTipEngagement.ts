import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { tipKeys, tipsApi } from '../api';
import type { Tip, TipListItem, TipListPage } from '../types';

type Patch = Partial<Pick<TipListItem, 'isBookmarked' | 'isHelpful' | 'helpfulCount'>>;

function applyToItem<T extends TipListItem>(item: T, id: string, patch: Patch): T {
  return item.id === id ? { ...item, ...patch } : item;
}

/**
 * Optimistic bookmark / "helpful" toggles for a tip. Patches the detail, the
 * tip-of-the-day and every cached list page in place; rolls back on error.
 */
export function useTipEngagement() {
  const qc = useQueryClient();

  const patchCaches = (id: string, patch: Patch): (() => void) => {
    const snapshots: (() => void)[] = [];

    const detailKey = tipKeys.detail(id);
    const prevDetail = qc.getQueryData<Tip>(detailKey);
    if (prevDetail) {
      qc.setQueryData<Tip>(detailKey, { ...prevDetail, ...patch });
      snapshots.push(() => qc.setQueryData(detailKey, prevDetail));
    }

    const todKey = tipKeys.tipOfDay();
    const prevTod = qc.getQueryData<Tip | null>(todKey);
    if (prevTod && prevTod.id === id) {
      qc.setQueryData<Tip | null>(todKey, { ...prevTod, ...patch });
      snapshots.push(() => qc.setQueryData(todKey, prevTod));
    }

    const listCaches = qc.getQueriesData<InfiniteData<TipListPage>>({ queryKey: tipKeys.lists() });
    for (const [key, data] of listCaches) {
      if (!data) continue;
      qc.setQueryData<InfiniteData<TipListPage>>(key, {
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
    { isBookmarked: boolean },
    unknown,
    { tipId: string; next: boolean },
    { rollback: () => void }
  >({
    mutationFn: ({ tipId, next }) => (next ? tipsApi.bookmark(tipId) : tipsApi.unbookmark(tipId)),
    onMutate: ({ tipId, next }) => {
      const rollback = patchCaches(tipId, { isBookmarked: next });
      return { rollback };
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
    onSettled: (_d, _e, { tipId }) => {
      void qc.invalidateQueries({ queryKey: tipKeys.detail(tipId) });
    },
  });

  const helpful = useMutation<
    { isHelpful: boolean; helpfulCount: number },
    unknown,
    { tipId: string; next: boolean; currentCount: number },
    { rollback: () => void }
  >({
    mutationFn: ({ tipId, next }) =>
      next ? tipsApi.markHelpful(tipId) : tipsApi.unmarkHelpful(tipId),
    onMutate: ({ tipId, next, currentCount }) => {
      const rollback = patchCaches(tipId, {
        isHelpful: next,
        helpfulCount: Math.max(0, currentCount + (next ? 1 : -1)),
      });
      return { rollback };
    },
    onSuccess: (res, { tipId }) => {
      // reconcile with the server's authoritative count
      patchCaches(tipId, { isHelpful: res.isHelpful, helpfulCount: res.helpfulCount });
    },
    onError: (_e, _v, ctx) => ctx?.rollback(),
  });

  return {
    toggleBookmark: (tipId: string, next: boolean) => bookmark.mutate({ tipId, next }),
    toggleHelpful: (tipId: string, next: boolean, currentCount: number) =>
      helpful.mutate({ tipId, next, currentCount }),
    isBookmarking: bookmark.isPending,
    isTogglingHelpful: helpful.isPending,
  };
}
