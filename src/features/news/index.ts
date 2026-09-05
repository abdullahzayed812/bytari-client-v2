/**
 * News feature — آخر الأخبار. The user-facing reading experience for the
 * backend content module's general news items (`/news*`): a searchable list
 * with a featured "خبر مميز", a sectioned detail screen with attached photos,
 * and a per-user bookmark toggle. Authoring is admin/supervisor-only via the
 * backend admin API — there is no mobile news-management screen.
 */
export { newsApi, newsKeys, type NewsApi } from './api';
export {
  useNews,
  useFeaturedNews,
  useNewsItem,
  useNewsBookmark,
  type UseNewsParams,
} from './hooks';
export {
  NewsCard,
  NewsCardSkeleton,
  FeaturedNewsCard,
  NewsPointList,
  type NewsCardProps,
} from './components';
export { NewsListScreen, NewsDetailScreen } from './screens';
export { NEWS_TAG_META, newsCategoryIcon } from './constants';
export * from './types';
