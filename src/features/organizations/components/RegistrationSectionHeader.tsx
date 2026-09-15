import { View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

interface Props {
  icon: IconName;
  title: string;
  required?: boolean;
}

/** Colored section header used by the Clinic / Veterinary Office registration forms. */
export function RegistrationSectionHeader({ icon, title, required }: Props) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surfaceAccent,
        borderRadius: theme.radius.lg,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
      }}
    >
      <Text variant="bodyMedium" weight="bold">
        {title}
        {required ? <Text color="danger"> *</Text> : null}
      </Text>
      <Icon name={icon} size="iconSm" color="primary" />
    </View>
  );
}
