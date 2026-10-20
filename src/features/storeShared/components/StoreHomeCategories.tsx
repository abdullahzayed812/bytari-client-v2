import { View } from 'react-native';

import { storeCategoryStyle } from '../accents';

import { StoreCategoryCard } from './StoreCategoryCard';

export interface StoreHomeCategory {
  id: string;
  slug: string;
  name: string;
  parentId?: string | null;
  imageUrl: string | null;
}

/**
 * The store home's category cards. `featured` (Pet Owners Store reference):
 * the first category is a full-width row card, the rest 2-up tiles; `grid`
 * (Veterinarian Store reference): 2-up tiles only. A lone last tile spans the
 * row. Sub-titles list each category's own sub-sections (real data, never
 * fixed copy).
 */
export function StoreHomeCategories({
  categories,
  allCategories,
  layout,
  onOpen,
}: {
  categories: StoreHomeCategory[];
  /** Every category — used to name each card's sub-sections. */
  allCategories: StoreHomeCategory[];
  layout: 'featured' | 'grid';
  onOpen: (category: StoreHomeCategory) => void;
}) {
  if (categories.length === 0) return null;
  const subtitleOf = (c: StoreHomeCategory) =>
    allCategories
      .filter((x) => x.parentId === c.id)
      .slice(0, 4)
      .map((x) => x.name)
      .join(' • ') || undefined;

  const card = (c: StoreHomeCategory, variant: 'featured' | 'tile', flex?: number) => {
    const parent = c.parentId ? allCategories.find((x) => x.id === c.parentId) : undefined;
    const style = storeCategoryStyle(c, parent);
    return (
      <StoreCategoryCard
        key={c.id}
        title={c.name}
        subtitle={subtitleOf(c)}
        icon={style.icon}
        imageUrl={c.imageUrl}
        accent={style.accent}
        variant={variant}
        height={variant === 'tile' ? 125 : undefined}
        flex={flex}
        onPress={() => onOpen(c)}
      />
    );
  };

  const [first, ...rest] = categories;
  const tiles = layout === 'featured' ? rest : categories;
  const rows: StoreHomeCategory[][] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));

  return (
    <View style={{ rowGap: 10 }}>
      {layout === 'featured' && first ? card(first, 'featured') : null}
      {rows.map((row) => (
        <View key={row.map((c) => c.id).join('|')} style={{ flexDirection: 'row', columnGap: 10 }}>
          {row.map((c) => card(c, 'tile', 1))}
        </View>
      ))}
    </View>
  );
}
