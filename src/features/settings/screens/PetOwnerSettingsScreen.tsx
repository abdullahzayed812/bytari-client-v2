import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Card, Chip, Icon, type IconName } from '@/components/content';
import { ConfirmationDialog, useToast } from '@/components/feedback';
import { Switch } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useLogoutMutation } from '@/features/auth';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications';
import { LANGUAGE_OPTIONS, languageLabelKey, setLanguage as applyI18nLanguage } from '@/i18n';
import { apiErrorMessage } from '@/lib/apiError';
import { usePreferencesStore, type AppLanguage } from '@/store';
import { useTheme } from '@/theme';
import type { ThemePreference } from '@/theme/ThemeProvider';

type ExpandableKey = 'language' | 'appearance';

/**
 * Route: `/(app)/settings` — "الإعدادات". Shared by the Pet Owner and the
 * Veterinarian interface (reachable from both category grids and the profile).
 */
export default function PetOwnerSettingsScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation('settings');
  const { t: tn } = useTranslation('nav');

  const language = usePreferencesStore((s) => s.language);
  const setLanguagePref = usePreferencesStore((s) => s.setLanguage);
  const themePreference = usePreferencesStore((s) => s.themePreference);
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference);

  const prefs = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const logout = useLogoutMutation();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [expanded, setExpanded] = useState<ExpandableKey | null>(null);

  const toggle = (key: ExpandableKey) => setExpanded((cur) => (cur === key ? null : key));

  const changeLanguage = async (next: AppLanguage) => {
    if (next === language) return;
    setLanguagePref(next);
    const { directionChanged } = await applyI18nLanguage(next);
    if (directionChanged) {
      toast.show({ message: tn('more.languageRestart'), tone: 'info', durationMs: 6000 });
    }
  };

  const changeTheme = (next: ThemePreference) => setThemePreference(next);

  const pushEnabled = prefs.data?.pushEnabled ?? false;

  return (
    <ScrollScreen padded={false}>
      <AppHeader title={t('title')} showBack />

      <View
        style={{
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.md,
          rowGap: theme.spacing.md,
        }}
      >
        {/* اللغة */}
        <Row
          icon="globe-outline"
          label={t('rows.language')}
          sublabel={tn(languageLabelKey(language))}
          expanded={expanded === 'language'}
          onPress={() => toggle('language')}
        >
          <ChipRow
            options={LANGUAGE_OPTIONS.map((o) => ({ value: o.value, label: tn(o.labelKey) }))}
            selected={language}
            onSelect={(v) => void changeLanguage(v as AppLanguage)}
          />
        </Row>

        {/* الإشعارات */}
        <Card padding="lg">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              columnGap: theme.spacing.md,
            }}
          >
            <Icon name="notifications-outline" size="iconMd" color="primary" />
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              {t('rows.notifications')}
            </Text>
            <Switch
              value={pushEnabled}
              disabled={prefs.isLoading || updatePrefs.isPending}
              onValueChange={(next) =>
                updatePrefs.mutate(next, {
                  onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
                })
              }
            />
          </View>
          {prefs.isError ? (
            <Caption color="danger" style={{ marginTop: theme.spacing.xs }}>
              {t('notificationsError')}
            </Caption>
          ) : null}
        </Card>

        {/* الخصوصية والأمان */}
        <Row
          icon="lock-closed-outline"
          label={t('rows.privacy')}
          onPress={() => router.push(Routes.settingsPrivacy)}
        />

        {/* تغيير كلمة المرور */}
        <Row
          icon="key-outline"
          label={t('rows.changePassword')}
          onPress={() => router.push(Routes.settingsChangePassword)}
        />

        {/* مظهر التطبيق */}
        <Row
          icon="moon-outline"
          label={t('rows.appearance')}
          sublabel={t(`appearance.${themePreference}`)}
          expanded={expanded === 'appearance'}
          onPress={() => toggle('appearance')}
        >
          <ChipRow
            options={[
              { value: 'light', label: t('appearance.light') },
              { value: 'dark', label: t('appearance.dark') },
              { value: 'system', label: t('appearance.system') },
            ]}
            selected={themePreference}
            onSelect={(v) => changeTheme(v as ThemePreference)}
          />
        </Row>

        {/* مساعدة */}
        <Row
          icon="help-circle-outline"
          label={t('rows.help')}
          onPress={() => router.push(Routes.contact)}
        />

        {/* عن التطبيق */}
        <Row
          icon="information-circle-outline"
          label={t('rows.about')}
          onPress={() => router.push(Routes.settingsAbout)}
        />

        <Section spacing="lg">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('signOut')}
            disabled={logout.isPending}
            onPress={() => setConfirmLogout(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              columnGap: theme.spacing.sm,
              paddingVertical: theme.spacing.lg,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.dangerSoft,
              opacity: pressed || logout.isPending ? 0.8 : 1,
            })}
          >
            <Icon name="log-out-outline" size="iconMd" color="danger" />
            <Text variant="bodyMedium" color="danger">
              {t('signOut')}
            </Text>
          </Pressable>
        </Section>
        <View style={{ height: theme.spacing.huge }} />
      </View>

      <ConfirmationDialog
        visible={confirmLogout}
        title={t('signOutConfirmTitle')}
        message={t('signOutConfirmBody')}
        confirmLabel={t('signOut')}
        cancelLabel={t('cancel')}
        destructive
        loading={logout.isPending}
        onConfirm={() => {
          setConfirmLogout(false);
          logout.mutate();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </ScrollScreen>
  );
}

// --- row -----------------------------------------------------------

function Row({
  icon,
  label,
  sublabel,
  expanded,
  onPress,
  children,
}: {
  icon: IconName;
  label: string;
  sublabel?: string;
  expanded?: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const hasExpand = children != null;
  return (
    <Card padding="lg">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: hasExpand ? Boolean(expanded) : undefined }}
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          columnGap: theme.spacing.md,
        }}
      >
        {/* logical order (start → end): icon · label · chevron — RTL puts the icon on the right */}
        <Icon name={icon} size="iconMd" color="primary" />
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyMedium">{label}</Text>
          {sublabel ? <Caption color="textSecondary">{sublabel}</Caption> : null}
        </View>
        <Icon
          name={hasExpand && expanded ? 'chevron-down' : 'chevron-forward'}
          size="iconSm"
          color="textMuted"
          directional={!(hasExpand && expanded)}
        />
      </Pressable>
      {hasExpand && expanded ? (
        <View style={{ marginTop: theme.spacing.md }}>{children}</View>
      ) : null}
    </Card>
  );
}

function ChipRow({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          selected={selected === o.value}
          onPress={() => onSelect(o.value)}
        />
      ))}
    </View>
  );
}
