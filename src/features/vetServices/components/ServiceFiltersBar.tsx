import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Chip, Icon } from '@/components/content';
import { BottomSheet } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
}

/**
 * Horizontal filter chip row (matches the reference). Each chip opens a
 * `BottomSheet` of options; a selected filter shows its value on the chip and
 * turns to the section accent colour.
 */
export function ServiceFiltersBar({
  filters,
  values,
  onChange,
}: {
  filters: FilterDef[];
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string | undefined) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('vetServices');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const active = filters.find((f) => f.key === openKey);

  return (
    <>
      <View style={{ paddingHorizontal: theme.screenPadding }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, justifyContent: 'flex-end' }}>
          <Icon name="options-outline" size="iconSm" color="serviceAccent" />
          <Caption style={{ color: theme.colors.serviceAccent }}>{t('filters.label')}</Caption>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // RN gives a ScrollView `flexGrow: 1` by default — inside this flex
        // column it stretches down and its `stretch`-aligned chips grow into
        // tall pills with a big empty gap beneath. Pin the height to content.
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          alignItems: 'center',
          columnGap: theme.spacing.sm,
          paddingHorizontal: theme.screenPadding,
          paddingVertical: theme.spacing.sm,
        }}
      >
        {filters.map((f) => {
          const v = values[f.key];
          const selectedLabel = v ? f.options.find((o) => o.value === v)?.label : undefined;
          return (
            <Chip
              key={f.key}
              label={selectedLabel ?? f.label}
              selected={Boolean(v)}
              icon="chevron-down"
              onPress={() => setOpenKey(f.key)}
            />
          );
        })}
      </ScrollView>

      <BottomSheet visible={openKey !== null} onClose={() => setOpenKey(null)} title={active?.label}>
        <View style={{ rowGap: theme.spacing.xs }}>
          <OptionRow
            label={t('filters.any')}
            active={active ? !values[active.key] : false}
            onPress={() => {
              if (active) onChange(active.key, undefined);
              setOpenKey(null);
            }}
          />
          {active?.options.map((o) => (
            <OptionRow
              key={o.value}
              label={o.label}
              active={values[active.key] === o.value}
              onPress={() => {
                onChange(active.key, o.value);
                setOpenKey(null);
              }}
            />
          ))}
        </View>
      </BottomSheet>
    </>
  );
}

function OptionRow({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: active ? theme.colors.serviceSurface : 'transparent',
      }}
    >
      <Text variant="bodyMedium">{label}</Text>
      {active ? <Icon name="checkmark" size="iconSm" color="serviceAccent" /> : null}
    </Pressable>
  );
}
