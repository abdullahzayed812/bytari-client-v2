import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Avatar, Badge } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

import type { OrganizationSupervisor } from '../types';

export interface SupervisorRowProps {
  supervisor: OrganizationSupervisor;
  right?: ReactNode;
}

/**
 * Presentational organization-supervisor row — the person plus a count of the
 * owner-selected organization permissions they hold. No API logic.
 */
export function SupervisorRow({ supervisor, right }: SupervisorRowProps) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const name =
    fullName(supervisor.user.firstName, supervisor.user.lastName) || supervisor.user.email;
  const count = supervisor.permissions.length;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}
    >
      <Avatar name={name} size="avatarMd" />
      <View style={{ flex: 1, rowGap: 4 }}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {name}
        </Text>
        <Caption numberOfLines={1}>{supervisor.user.email}</Caption>
        <View style={{ marginTop: 2 }}>
          <Badge label={t('supervisors.permissionCount', { count })} tone="info" size="sm" />
        </View>
      </View>
      {right ?? null}
    </View>
  );
}
