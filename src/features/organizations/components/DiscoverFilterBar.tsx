import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { useToast } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { Text } from '@/components/typography';
import { useCurrentLocation, type Coordinates } from '@/hooks';
import { useTheme } from '@/theme';

import type { DiscoverSort } from '../types';

interface FilterButtonProps {
  icon?: IconName;
  label: string;
  active?: boolean;
  loading?: boolean;
  onPress: () => void;
}

/** "تصفية" / "الأقرب" / "الكل" pill — a mutually-exclusive `sort` toggle plus "Filter". */
function FilterButton({ icon, label, active, loading, onPress }: FilterButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, busy: loading }}
      accessibilityLabel={label}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: theme.spacing.xs,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.radius.lg,
          borderWidth: active ? 0 : 1.5,
          borderColor: theme.colors.border,
          backgroundColor: active ? theme.colors.primary : theme.colors.surface,
        },
        pressed && { opacity: 0.8 },
        loading && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={active ? theme.colors.onPrimary : theme.colors.primary}
        />
      ) : icon ? (
        <Icon name={icon} size="iconSm" color={active ? 'onPrimary' : 'textSecondary'} />
      ) : null}
      <Text
        variant="label"
        style={{ color: active ? theme.colors.onPrimary : theme.colors.textSecondary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export interface DiscoverFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  sort: DiscoverSort;
  onSortChange: (sort: DiscoverSort, coords?: Coordinates) => void;
  /** No dedicated filter criteria exist on the backend yet — shows a "coming soon" toast. */
  onFilterPress?: () => void;
}

/**
 * The search field + "تصفية" / "الأقرب" / "الكل" row shared by every
 * organization discover screen (clinics, veterinary offices). `sort=nearest`
 * requires a real device location fix — the backend computes and orders by
 * actual great-circle distance; this component never estimates it itself.
 */
export function DiscoverFilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  sort,
  onSortChange,
  onFilterPress,
}: DiscoverFilterBarProps) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const location = useCurrentLocation();

  const handleFilterPress =
    onFilterPress ?? (() => toast.show({ message: tc('comingSoon'), tone: 'info' }));

  const selectNearest = async () => {
    const fix = await location.request();
    if (!fix) {
      const message =
        location.error === 'permission_denied'
          ? t('discover.locationPermissionDenied')
          : location.error === 'unavailable'
            ? t('discover.locationUnavailable')
            : t('discover.locationError');
      toast.show({ message, tone: 'warning' });
      return;
    }
    onSortChange('nearest', fix);
  };

  return (
    <View
      style={{
        paddingHorizontal: theme.screenPadding,
        paddingTop: theme.spacing.md,
        rowGap: theme.spacing.md,
      }}
    >
      <SearchInput
        value={search}
        onChangeText={onSearchChange}
        onClear={() => onSearchChange('')}
        placeholder={searchPlaceholder}
        accessibilityLabel={searchPlaceholder}
      />
      <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
        <FilterButton icon="funnel-outline" label={t('discover.filter')} onPress={handleFilterPress} />
        <FilterButton
          icon="locate-outline"
          label={t('discover.nearest')}
          active={sort === 'nearest'}
          loading={location.isLoading}
          onPress={() => void selectNearest()}
        />
        <FilterButton
          label={t('discover.all')}
          active={sort === 'default'}
          onPress={() => onSortChange('default')}
        />
      </View>
    </View>
  );
}
