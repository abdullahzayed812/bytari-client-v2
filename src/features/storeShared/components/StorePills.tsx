import { Pressable, ScrollView } from 'react-native';

import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { StoreAccent } from '../accents';

export interface StorePill {
  /** `undefined` = the "الكل" pill. */
  id: string | undefined;
  label: string;
}

/** Horizontal filter pills of the category pages — the active one filled with the page accent. */
export function StorePills({
  items,
  selectedId,
  onSelect,
  accent,
}: {
  items: StorePill[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
  accent: StoreAccent;
}) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ columnGap: 8, paddingHorizontal: 16 }}
    >
      {items.map((p) => {
        const active = p.id === selectedId;
        return (
          <Pressable
            key={p.id ?? '__all'}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(p.id)}
            style={({ pressed }) => ({
              paddingHorizontal: active ? 18 : 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: active ? accent.main : theme.colors.surface,
              borderWidth: 1,
              borderColor: active ? accent.main : dark ? theme.colors.border : '#E5E7EB',
              transform: pressed ? [{ scale: 0.96 }] : undefined,
            })}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: active ? theme.fontFamily.displaySemiBold : theme.fontFamily.bodyMedium,
                fontSize: 12,
                lineHeight: 18,
                color: active ? '#FFFFFF' : theme.colors.textSecondary,
              }}
            >
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
