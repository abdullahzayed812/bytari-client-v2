import type { BadgeTone, IconName } from '@/components/content';

import type { NewsTag } from './types';

interface TagMeta {
  tone: BadgeTone;
  /** i18n key under `news:tag.*`; NORMAL renders no badge. */
  show: boolean;
}

export const NEWS_TAG_META: Record<NewsTag, TagMeta> = {
  URGENT: { tone: 'danger', show: true },
  IMPORTANT_ALERT: { tone: 'warning', show: true },
  NORMAL: { tone: 'neutral', show: false },
};

/** Category slug → line icon (best-effort; unknown slugs fall back to a tag icon). */
const CATEGORY_ICON: Record<string, IconName> = {
  'prices-markets': 'trending-up-outline',
  husbandry: 'leaf-outline',
  'disease-prevention': 'shield-checkmark-outline',
  health: 'heart-outline',
  nutrition: 'nutrition-outline',
};

export function newsCategoryIcon(slug: string | undefined): IconName {
  return (slug && CATEGORY_ICON[slug]) || 'pricetag-outline';
}
