import type { BadgeTone, IconName } from '@/components/content';

import type { TipPriority } from './types';

interface PriorityMeta {
  tone: BadgeTone;
  /** Whether to show a badge at all (NORMAL tips get none). */
  show: boolean;
}

export const TIP_PRIORITY_META: Record<TipPriority, PriorityMeta> = {
  IMPORTANT: { tone: 'danger', show: true },
  RECOMMENDED: { tone: 'warning', show: true },
  NORMAL: { tone: 'neutral', show: false },
};

/** Category slug → line icon (best-effort; unknown slugs fall back to a leaf). */
const CATEGORY_ICON: Record<string, IconName> = {
  nutrition: 'leaf-outline',
  health: 'heart-outline',
  production: 'stats-chart-outline',
  births: 'egg-outline',
  breeding: 'egg-outline',
  care: 'sparkles-outline',
};

export function categoryIcon(slug: string | undefined): IconName {
  return (slug && CATEGORY_ICON[slug]) || 'pricetag-outline';
}
