import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Chip } from '@/components/content';
import { useTheme } from '@/theme';

import { CONTENT_TYPE_ORDER } from '../constants';
import type { ContentCategory, ContentType } from '../types';

export interface ContentFiltersProps {
  /** `null` when the type filter is not shown (a type-scoped list already fixes it). */
  type?: ContentType | null;
  onTypeChange?: (type: ContentType | undefined) => void;
  categories?: ContentCategory[];
  categoryId?: string;
  onCategoryChange: (categoryId: string | undefined) => void;
}

/**
 * The backend-supported filter controls (§15): a content-type chip row (only
 * when not already type-scoped) and a category chip row. No author / date
 * filter — the backend exposes none.
 */
export function ContentFilters({
  type,
  onTypeChange,
  categories = [],
  categoryId,
  onCategoryChange,
}: ContentFiltersProps) {
  const theme = useTheme();
  const { t } = useTranslation('content');

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      {type !== null && onTypeChange ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <Chip
            label={t('filters.allTypes')}
            selected={type === undefined}
            onPress={() => onTypeChange(undefined)}
          />
          {CONTENT_TYPE_ORDER.map((ct) => (
            <Chip
              key={ct}
              label={t(`type.${ct}`)}
              selected={type === ct}
              onPress={() => onTypeChange(type === ct ? undefined : ct)}
            />
          ))}
        </View>
      ) : null}

      {categories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.xs, paddingVertical: 2 }}
        >
          <Chip
            label={t('filters.allCategories')}
            selected={!categoryId}
            onPress={() => onCategoryChange(undefined)}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              selected={categoryId === c.id}
              onPress={() => onCategoryChange(categoryId === c.id ? undefined : c.id)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
