import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/feedback';
import { THREE_UP_COUNT, ThreeUpRow } from '@/components/layout';
import type { AnimalSection } from '@/constants/animalSections';
import { Routes } from '@/constants/routes';

import { useTipEngagement, useTips } from '../hooks';

import { TipGridCard } from './TipGridCard';

/**
 * A small preview (three cards) of one animal section's tips — the section
 * home pages' "النصائح", in the card of the full tips page. "عرض الكل" is
 * the caller's section header → the full tips page for the same section.
 */
export function TipsSectionPreview({ sections }: { sections: AnimalSection[] }) {
  const { t } = useTranslation('tips');
  const tips = useTips({ pageSize: THREE_UP_COUNT, sections });
  const { toggleBookmark } = useTipEngagement();
  return (
    <ThreeUpRow
      items={tips.tips}
      loading={tips.isLoading}
      keyOf={(tip) => tip.id}
      empty={<EmptyState icon="bulb-outline" title={t('list.empty')} />}
      renderItem={(tip, width) => (
        <TipGridCard
          tip={tip}
          width={width}
          onPress={() => router.push(Routes.tip(tip.id))}
          onToggleBookmark={(next) => toggleBookmark(tip.id, next)}
        />
      )}
    />
  );
}
