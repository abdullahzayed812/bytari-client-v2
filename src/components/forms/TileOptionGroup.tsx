import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface TileOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  hint?: string;
}

export interface TileOptionGroupProps<T extends string> {
  options: TileOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
}

/**
 * A row of selectable icon+label(+hint) tiles — the segmented picker style
 * already used for "نوع الإنتاج" (`PoultryFarmForm`'s production-type field).
 * Extracted here once it was needed a 3rd+ time (bird type, egg type, sell
 * unit, pricing method, trader type).
 */
export function TileOptionGroup<T extends string>({
  options,
  value,
  onChange,
  error,
}: TileOptionGroupProps<T>) {
  const theme = useTheme();

  return (
    <View style={{ rowGap: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: theme.spacing.md, rowGap: theme.spacing.md }}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={opt.label}
              onPress={() => onChange(opt.value)}
              style={{
                flexGrow: 1,
                flexBasis: '30%',
                alignItems: 'center',
                rowGap: 4,
                paddingVertical: theme.spacing.lg,
                paddingHorizontal: theme.spacing.sm,
                borderRadius: theme.radius.lg,
                borderWidth: 1.5,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
              }}
            >
              {opt.icon ? (
                <Icon name={opt.icon} size="iconLg" color={selected ? 'primary' : 'textMuted'} />
              ) : null}
              <Text
                variant="bodyMedium"
                weight={selected ? 'bold' : 'regular'}
                style={{ color: selected ? theme.colors.primary : theme.colors.textPrimary }}
              >
                {opt.label}
              </Text>
              {opt.hint ? <Caption>{opt.hint}</Caption> : null}
            </Pressable>
          );
        })}
      </View>
      {error ? <Caption style={{ color: theme.colors.danger }}>{error}</Caption> : null}
    </View>
  );
}
