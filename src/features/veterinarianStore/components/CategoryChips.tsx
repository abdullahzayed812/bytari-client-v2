import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Chip } from '@/components/content';
import { useTheme } from '@/theme';

import type { VetStoreCategory } from '../types';

interface CategoryChipsProps {
  categories: VetStoreCategory[];
  selectedId: string | undefined;
  onSelect: (categoryId: string | undefined) => void;
}

/**
 * Two-level filter rail. Row 1: "الكل" + one chip per SECTION (top-level
 * category). Row 2 (when the active section has sub-categories): "كل <section>"
 * + one chip per sub-category. Selecting a section filters by the section id —
 * the backend expands it to the section's own + every sub-category's products.
 */
export function CategoryChips({ categories, selectedId, onSelect }: CategoryChipsProps) {
  const theme = useTheme();
  const { t } = useTranslation('veterinarianStore');

  const ids = new Set(categories.map((c) => c.id));
  // a sub-category whose section is hidden / inactive is shown as a section
  const isSection = (c: VetStoreCategory) => !c.parentId || !ids.has(c.parentId);
  const sections = categories.filter(isSection);
  const selected = categories.find((c) => c.id === selectedId);
  const activeSection = selected
    ? isSection(selected)
      ? selected
      : categories.find((c) => c.id === selected.parentId)
    : undefined;
  const children = activeSection ? categories.filter((c) => c.parentId === activeSection.id) : [];

  const rail = {
    columnGap: theme.spacing.sm,
    paddingHorizontal: theme.screenPadding,
  };

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={rail}>
        <Chip
          label={t('categories.all')}
          selected={selectedId === undefined}
          onPress={() => onSelect(undefined)}
        />
        {sections.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            selected={activeSection?.id === c.id}
            onPress={() => onSelect(c.id)}
          />
        ))}
      </ScrollView>
      {activeSection && children.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={rail}>
          <Chip
            label={t('categories.allInSection', { name: activeSection.name })}
            selected={selectedId === activeSection.id}
            onPress={() => onSelect(activeSection.id)}
          />
          {children.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              selected={selectedId === c.id}
              onPress={() => onSelect(c.id)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
