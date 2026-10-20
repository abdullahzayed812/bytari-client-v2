import { useTranslation } from 'react-i18next';

import { ContentGridCard, type BadgeTone } from '@/components/content';

import { TIP_PRIORITY_META } from '../constants';
import type { TipListItem, TipPriority } from '../types';

/** The reference's badge colours: «مهم» amber, «موصى بها» green. */
const GRID_BADGE_TONE: Record<TipPriority, BadgeTone> = {
  IMPORTANT: 'warning',
  RECOMMENDED: 'success',
  NORMAL: 'neutral',
};

/**
 * Compact tip card of the "النصائح" reference — the 3-up grid of the full
 * tips page and the three-card "النصائح" previews on the section home pages.
 * Priority badge («مهم» / «موصى بها»), category chip, reading time, bookmark.
 */
export function TipGridCard({
  tip,
  width,
  onPress,
  onToggleBookmark,
}: {
  tip: TipListItem;
  width: number;
  onPress: () => void;
  onToggleBookmark?: (next: boolean) => void;
}) {
  const { t } = useTranslation('tips');
  const priority = TIP_PRIORITY_META[tip.priority];
  return (
    <ContentGridCard
      width={width}
      title={tip.title}
      imageUrl={tip.coverImageUrl}
      fallbackIcon="bulb-outline"
      badge={
        priority.show
          ? { label: t(`priority.${tip.priority}`), tone: GRID_BADGE_TONE[tip.priority] }
          : null
      }
      chip={tip.category?.name ?? null}
      meta={{
        icon: 'time-outline',
        text: tip.readMinutes ? t('meta.minutes', { count: tip.readMinutes }) : t('meta.quickRead'),
      }}
      bookmark={
        onToggleBookmark
          ? {
              saved: tip.isBookmarked,
              onToggle: onToggleBookmark,
              saveLabel: t('actions.saveA11y'),
              unsaveLabel: t('actions.unsaveA11y'),
            }
          : undefined
      }
      onPress={onPress}
      accessibilityLabel={t('card.open', { title: tip.title })}
    />
  );
}
