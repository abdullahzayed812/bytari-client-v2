import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/feedback';
import { THREE_UP_COUNT, ThreeUpRow } from '@/components/layout';
import type { AnimalSection } from '@/constants/animalSections';
import { Routes } from '@/constants/routes';

import { useNews, useNewsBookmark } from '../hooks';

import { NewsGridCard } from './NewsGridCard';

/**
 * Exactly three latest news cards of one animal section (the section home
 * pages' "آخر الأخبار"), in the card of the full news page. "عرض الكل" is the
 * caller's section header → the full news page for the same section.
 */
export function NewsSectionPreview({ sections }: { sections: AnimalSection[] }) {
  const { t } = useTranslation('news');
  const news = useNews({ pageSize: THREE_UP_COUNT, sections });
  const { toggleBookmark } = useNewsBookmark();
  return (
    <ThreeUpRow
      items={news.news}
      loading={news.isLoading}
      keyOf={(n) => n.id}
      empty={<EmptyState icon="newspaper-outline" title={t('list.empty')} />}
      renderItem={(item, width) => (
        <NewsGridCard
          item={item}
          width={width}
          onPress={() => router.push(Routes.newsDetail(item.id))}
          onToggleBookmark={(next) => toggleBookmark(item.id, next, item.bookmarkCount)}
        />
      )}
    />
  );
}
