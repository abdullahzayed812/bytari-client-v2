import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Avatar, Badge } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

import { MEMBERSHIP_STATUS_TONE, ORG_ROLE_TONE } from '../constants';
import type { OrganizationMember, OrgRoleKey } from '../types';

export interface MemberRowProps {
  member: OrganizationMember;
  /** Trailing slot — e.g. a manage `IconButton`. Screens own the actions. */
  right?: ReactNode;
}

const KNOWN_ROLE_TONE = (roleKey: string) =>
  roleKey in ORG_ROLE_TONE ? ORG_ROLE_TONE[roleKey as OrgRoleKey] : 'neutral';

/** Presentational member row — avatar, name, email, role + status pills. No API logic. */
export function MemberRow({ member, right }: MemberRowProps) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const name = fullName(member.user.firstName, member.user.lastName) || member.user.email;

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
        <Caption numberOfLines={1}>{member.user.email}</Caption>
        <View
          style={{
            flexDirection: 'row',
            columnGap: theme.spacing.xs,
            flexWrap: 'wrap',
            marginTop: 2,
          }}
        >
          <Badge
            label={t(`role.${member.roleKey}`, { defaultValue: member.roleKey })}
            tone={KNOWN_ROLE_TONE(member.roleKey)}
            size="sm"
          />
          <Badge
            label={t(`memberStatus.${member.status}`)}
            tone={MEMBERSHIP_STATUS_TONE[member.status]}
            size="sm"
          />
        </View>
      </View>
      {right ?? null}
    </View>
  );
}
