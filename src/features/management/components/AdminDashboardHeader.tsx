import { View } from 'react-native';

import { Avatar } from '@/components/content';
import { SearchInput } from '@/components/forms';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate, formatWeekday } from '@/utils';

interface Props {
  name: string;
  roleLabel: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  greeting: string;
  subtitle: string;
}

/** Avatar/name/role + live search-the-grid field + date/greeting banner. */
export function AdminDashboardHeader({
  name,
  roleLabel,
  search,
  onSearchChange,
  searchPlaceholder,
  greeting,
  subtitle,
}: Props) {
  const theme = useTheme();
  const now = new Date().toISOString();

  return (
    <View style={{ rowGap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
        <Avatar name={name} size="avatarMd" />
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium" weight="bold" numberOfLines={1}>
            {name}
          </Text>
          <Caption>{roleLabel}</Caption>
        </View>
      </View>

      <SearchInput
        value={search}
        onChangeText={onSearchChange}
        onClear={() => onSearchChange('')}
        placeholder={searchPlaceholder}
        accessibilityLabel={searchPlaceholder}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.primarySoft,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium" weight="bold" color="primary" numberOfLines={1}>
            {greeting}
          </Text>
          <Caption>{subtitle}</Caption>
        </View>
        <Caption>
          {formatWeekday(now)} · {formatDate(now)}
        </Caption>
      </View>
    </View>
  );
}
