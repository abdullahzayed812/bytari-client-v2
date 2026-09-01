import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface AccountTypeCardProps {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
}

/** Selectable account-type card used on `AccountTypeScreen`. */
export function AccountTypeCard({ icon, title, description, onPress }: AccountTypeCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.md,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
          backgroundColor: pressed ? theme.colors.primarySoft : theme.colors.surface,
        },
      ]}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size="iconLg" color="primary" />
      </View>
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Caption>{description}</Caption>
      </View>
      <Icon name="chevron-forward" size="iconSm" color="textMuted" directional />
    </Pressable>
  );
}
