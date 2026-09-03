import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

interface Props {
  icon: IconName;
  label: string;
  onPress: () => void;
}

/** A management navigation card on the Farm Details screen (treatments / cases / …). */
export function FarmSectionCard({ icon, label, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexGrow: 1,
          flexBasis: '45%',
          minWidth: 140,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          columnGap: theme.spacing.sm,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm, flex: 1 }}
      >
        <Icon name={icon} size="iconMd" color="primary" />
        <Text variant="label" numberOfLines={2} style={{ flex: 1 }}>
          {label}
        </Text>
      </View>
      <Icon name="chevron-forward" directional size="iconXs" color="textMuted" />
    </Pressable>
  );
}
