import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { Chip } from '@/components/content';
import { useTheme } from '@/theme';

import type { PetStoreCategory } from '../types';

interface CategoryChipsProps {
  categories: PetStoreCategory[];
  selectedId: string | undefined;
  onSelect: (categoryId: string | undefined) => void;
}

/** Horizontal filter rail: "الكل" + one chip per category. */
export function CategoryChips({ categories, selectedId, onSelect }: CategoryChipsProps) {
  const theme = useTheme();
  const { t } = useTranslation('petOwnerStore');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        columnGap: theme.spacing.sm,
        paddingHorizontal: theme.screenPadding,
      }}
    >
      <Chip
        label={t('categories.all')}
        selected={selectedId === undefined}
        onPress={() => onSelect(undefined)}
      />
      {categories.map((c) => (
        <Chip
          key={c.id}
          label={c.name}
          selected={selectedId === c.id}
          onPress={() => onSelect(c.id)}
        />
      ))}
    </ScrollView>
  );
}
