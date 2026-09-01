import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { ORG_TYPE_ICON } from '../constants';
import type { MyOrganization } from '../types';

import { OrganizationStatusBadge } from './OrganizationStatusBadge';
import { OrganizationTypeBadge } from './OrganizationTypeBadge';

export interface OrganizationCardProps {
  organization: MyOrganization;
  onPress?: () => void;
}

/**
 * Purely presentational organization row — no query logic. Shows only fields the
 * backend returns on the list item (name, type, lifecycle status) plus the
 * caller's `myRole`.
 */
export function OrganizationCard({ organization, onPress }: OrganizationCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const org = organization;
  const roleKey = org.myRole;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.open', { name: org.name })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.lg,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={ORG_TYPE_ICON[org.type]} size="iconMd" color="primary" />
      </View>

      <View style={{ flex: 1, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {org.name}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: theme.spacing.xs,
            flexWrap: 'wrap',
          }}
        >
          <OrganizationTypeBadge type={org.type} />
          <OrganizationStatusBadge status={org.status} />
        </View>
        {roleKey ? <Caption>{t(`role.${roleKey}`, { defaultValue: roleKey })}</Caption> : null}
      </View>

      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
