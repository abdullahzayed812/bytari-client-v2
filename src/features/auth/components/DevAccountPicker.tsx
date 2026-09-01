import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Row } from '@/components/layout';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

/**
 * DEVELOPMENT ONLY quick-login for the backend seed personas
 * (`server/src/database/dev-seed/personas.ts`, `server/docs/DEV_SEED.md`).
 *
 * Renders nothing unless `__DEV__` — release builds statically replace `__DEV__`
 * with `false`, so this whole tree is dead-code-eliminated and never ships.
 *
 * Tapping a chip just fills the real login form and submits it through the
 * normal `POST /api/v1/auth/login` flow. It does NOT bypass authentication and
 * stores no credentials — the shared dev password below is the well-known seed
 * password, not a secret, and only exists in a dev bundle.
 */

/** Shared password for every seeded dev persona. */
const DEV_PASSWORD = 'DevPassword123!';

/** Admin / moderator first, then owners, then organization members. */
const DEV_ACCOUNTS = [
  { labelKey: 'devLogin.roles.admin', email: 'admin@example.test' },
  { labelKey: 'devLogin.roles.moderator', email: 'moderator@example.test' },
  { labelKey: 'devLogin.roles.owner', email: 'owner@example.test' },
  { labelKey: 'devLogin.roles.vetApproved', email: 'vet@example.test', glyph: '✓' },
  { labelKey: 'devLogin.roles.vetPending', email: 'vet.pending@example.test', glyph: '⏳' },
  { labelKey: 'devLogin.roles.vetRejected', email: 'vet.rejected@example.test', glyph: '✗' },
  { labelKey: 'devLogin.roles.clinicOwner', email: 'clinic.owner@example.test' },
  { labelKey: 'devLogin.roles.farmOwner', email: 'farm.owner@example.test' },
  { labelKey: 'devLogin.roles.officeOwner', email: 'office.owner@example.test' },
  { labelKey: 'devLogin.roles.storeOwner', email: 'store.owner@example.test' },
  { labelKey: 'devLogin.roles.orgVet', email: 'org.vet@example.test' },
  { labelKey: 'devLogin.roles.orgSupervisor', email: 'supervisor@example.test' },
  { labelKey: 'devLogin.roles.orgStaff', email: 'staff@example.test' },
  { labelKey: 'devLogin.roles.multiOrg', email: 'multi.org@example.test' },
] as const;

export interface DevAccountPickerProps {
  /** Fill the login form with these credentials and submit it. */
  onPick: (email: string, password: string) => void;
  disabled?: boolean;
}

export function DevAccountPicker({ onPick, disabled }: DevAccountPickerProps) {
  const theme = useTheme();
  const { t } = useTranslation('auth');

  if (!__DEV__) return null;

  return (
    <View
      style={{
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        rowGap: theme.spacing.sm,
      }}
    >
      <Text variant="label" color="textSecondary">
        {t('devLogin.title')}
      </Text>
      <Text variant="caption" color="textMuted">
        {t('devLogin.hint', { password: DEV_PASSWORD })}
      </Text>

      <Row gap="xs" wrap align="center">
        {DEV_ACCOUNTS.map((account) => {
          const role = t(account.labelKey);
          const glyph = 'glyph' in account ? account.glyph : undefined;
          const label = glyph ? `${role} ${glyph}` : role;
          return (
            <Pressable
              key={account.email}
              accessibilityRole="button"
              accessibilityLabel={t('devLogin.a11yLogin', { role })}
              disabled={disabled}
              hitSlop={6}
              onPress={() => onPick(account.email, DEV_PASSWORD)}
              style={({ pressed }) => [
                {
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.colors.primarySoft,
                },
                pressed && { opacity: 0.6 },
                disabled && { opacity: 0.4 },
              ]}
            >
              <Text variant="caption" color="primary">
                {label}
              </Text>
            </Pressable>
          );
        })}
      </Row>
    </View>
  );
}
