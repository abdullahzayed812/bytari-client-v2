/**
 * Tips feature — أفضل النصائح. The user-facing reading experience for the
 * backend content module's structured care tips (`/tips*`): a searchable list
 * with a featured "نصيحة اليوم", a sectioned detail screen, and per-user
 * bookmark / "helpful" toggles. Authoring is admin/supervisor-only via the
 * backend admin API — there is no mobile tip-management screen.
 */
export { tipsApi, tipKeys, type TipsApi } from './api';
export { useTips, useTip, useTipOfTheDay, useTipEngagement, type UseTipsParams } from './hooks';
export {
  TipCard,
  TipCardSkeleton,
  FeaturedTipCard,
  TipPointList,
  type TipCardProps,
} from './components';
export { TipsListScreen, TipDetailScreen } from './screens';
export { TIP_PRIORITY_META, categoryIcon } from './constants';
export * from './types';
