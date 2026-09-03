import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Avatar, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import type { OrganizationMember } from '@/features/organizations/types';
import { useTheme } from '@/theme';

interface Props {
  member: OrganizationMember;
  onChat?: () => void;
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'صاحب الحقل',
  VETERINARIAN: 'طبيب بيطري',
  SUPERVISOR: 'مشرف',
  STAFF: 'مشرف مزرعة',
};

/** A doctor / worker row in the "الأطباء والعمال" list on the Farm Details screen. */
export function FarmStaffRow({ member, onChat }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const name = `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}
    >
      <Avatar name={name} size={40} />
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="label" weight="bold" numberOfLines={1}>
          {name}
        </Text>
        <Caption>{ROLE_LABEL[member.roleKey] ?? member.roleKey}</Caption>
      </View>
      {onChat ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('details.staffChat')}
          onPress={onChat}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: theme.spacing.xs,
              paddingVertical: theme.spacing.xs,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              borderColor: theme.colors.primary,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Icon name="chatbubble-ellipses-outline" size="iconXs" color="primary" />
          <Text variant="overline" color="primary">
            {t('details.staffChat')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
