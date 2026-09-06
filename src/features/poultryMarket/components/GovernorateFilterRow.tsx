import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Text } from '@/components/typography';
import { IRAQ_GOVERNORATES } from '@/constants/governorates';
import { FilterChips } from '@/features/admin/components';
import { useTheme } from '@/theme';

export interface GovernorateFilterRowProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

/**
 * "جميع المحافظات" bar with a funnel icon that reveals a governorate chip
 * row underneath (the poultry/egg market screenshots' collapsible filter).
 */
export function GovernorateFilterRow({ value, onChange }: GovernorateFilterRowProps) {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={t('filters.allGovernorates')}
        onPress={() => setExpanded((e) => !e)}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.screenPadding,
            paddingVertical: theme.spacing.md,
            marginHorizontal: theme.screenPadding,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text variant="bodyMedium">{value ?? t('filters.allGovernorates')}</Text>
        <Icon name="filter-outline" size="iconSm" color="primary" />
      </Pressable>

      {expanded ? (
        <FilterChips<string>
          value={value}
          onChange={(v) => onChange(v)}
          options={[
            { value: undefined, label: t('filters.allGovernorates') },
            ...IRAQ_GOVERNORATES.map((g) => ({ value: g, label: g })),
          ]}
        />
      ) : null}
    </View>
  );
}
