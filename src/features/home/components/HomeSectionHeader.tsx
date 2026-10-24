import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** "Section title  ·  action link" row used across the Home screen. */
export function HomeSectionHeader({ title, actionLabel, onAction }: Props) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: theme.spacing.md,
        marginBottom: theme.spacing.md,
      }}
    >
      {/* `flex: 1` gives the title the row's remaining width instead of its own
          measured width: on some Android devices that measurement comes back a
          few px short, the last word ("الأخبار" of "آخر الأخبار") wraps onto a
          line outside the measured height and silently disappears. */}
      <Label style={{ flex: 1 }}>{title}</Label>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', columnGap: 2 }}
        >
          <Text variant="label" color="primary">
            {actionLabel}
          </Text>
          <Icon name="chevron-forward" size="iconXs" color="primary" directional />
        </Pressable>
      ) : null}
    </View>
  );
}
