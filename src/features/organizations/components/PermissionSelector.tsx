import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Divider } from '@/components/content';
import { Checkbox } from '@/components/forms';
import { Caption, Label } from '@/components/typography';
import { useTheme } from '@/theme';

import { ORG_PERMISSION_GROUPS } from '../constants';

export interface PermissionSelectorProps {
  /** Currently-selected permission keys. */
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

/**
 * Grouped checkbox list for choosing an organization supervisor's permissions.
 * The keys come straight from `ORG_PERMISSION_GROUPS`, which is a presentation
 * grouping of the backend `ORG_PERMISSION_KEYS` catalogue — the client never
 * invents a key, and the backend re-validates every submitted key.
 *
 * Selection state is held by the parent form; this component only ever emits a
 * new array. It cannot be used to "grant" anything — the backend authorises the
 * assigning actor (`supervisor.assign`) and the final permission set.
 */
export function PermissionSelector({ value, onChange, disabled }: PermissionSelectorProps) {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const selected = new Set(value);

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    // Preserve catalogue order for a stable payload.
    onChange(ORG_PERMISSION_GROUPS.flatMap((g) => g.permissions).filter((k) => next.has(k)));
  };

  return (
    <View style={{ rowGap: theme.spacing.lg }}>
      {ORG_PERMISSION_GROUPS.map((group, i) => (
        <View key={group.key} style={{ rowGap: theme.spacing.sm }}>
          {i > 0 ? <Divider spacing="none" /> : null}
          <Label>{t(`permissionGroups.${group.key}`)}</Label>
          <View style={{ rowGap: theme.spacing.md }}>
            {group.permissions.map((key) => (
              <Checkbox
                key={key}
                label={t(`permissions.${key}.label`)}
                description={t(`permissions.${key}.hint`)}
                checked={selected.has(key)}
                disabled={disabled}
                onChange={() => toggle(key)}
              />
            ))}
          </View>
        </View>
      ))}
      <Caption>{t('supervisors.permissionSelectorHint')}</Caption>
    </View>
  );
}
