import { useTranslation } from 'react-i18next';

import { ContentGridCard } from '@/components/content';
import { formatDate } from '@/utils';

import { NEWS_TAG_META } from '../constants';
import type { NewsListItem } from '../types';

/**
 * Compact news card of the "آخر الأخبار" reference — the 3-up grid of the
 * full news page and the three-card "آخر الأخبار" previews on the section
 * home pages. Tag badge only for urgent / important items, category chip,
 * publish date, bookmark toggle.
 */
export function NewsGridCard({
  item,
  width,
  onPress,
  onToggleBookmark,
}: {
  item: NewsListItem;
  width: number;
  onPress: () => void;
  onToggleBookmark?: (next: boolean) => void;
}) {
  const { t } = useTranslation('news');
  const tag = NEWS_TAG_META[item.tag];
  return (
    <ContentGridCard
      width={width}
      title={item.title}
      imageUrl={item.coverImageUrl}
      fallbackIcon="newspaper-outline"
      badge={tag.show ? { label: t(`tag.${item.tag}`), tone: tag.tone } : null}
      chip={item.category?.name ?? null}
      meta={
        item.publishedAt ? { icon: 'calendar-outline', text: formatDate(item.publishedAt) } : null
      }
      bookmark={
        onToggleBookmark
          ? {
              saved: item.isBookmarked,
              onToggle: onToggleBookmark,
              saveLabel: t('actions.saveA11y'),
              unsaveLabel: t('actions.unsaveA11y'),
            }
          : undefined
      }
      onPress={onPress}
      accessibilityLabel={t('card.open', { title: item.title })}
    />
  );
}
