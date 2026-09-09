import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Avatar, Badge, Card, Chip, Divider, Icon } from '@/components/content';
import { ConfirmationDialog, useToast } from '@/components/feedback';
import { Switch } from '@/components/forms';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import {
  useLogoutAllMutation,
  useLogoutMutation,
  useVeterinarianStatus,
  VeterinarianStatusBadge,
} from '@/features/auth';
import { useAppMode, useAuth, useCapabilities } from '@/hooks';
import { setLanguage as applyI18nLanguage } from '@/i18n';
import { usePreferencesStore, type AppLanguage } from '@/store';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

type Pending = 'none' | 'one' | 'all';

/**
 * Account screen (§17). Shows safe user info + veterinarian status, the mode
 * switcher (§15), the management entry point (§16), and sign-out actions.
 * No profile editing / password change / deletion (not in scope).
 */
export default function AccountScreen() {
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const { t: tn } = useTranslation('nav');
  const toast = useToast();
  const { user } = useAuth();
  const caps = useCapabilities();
  const vet = useVeterinarianStatus();
  const mode = useAppMode();
  const themePreference = usePreferencesStore((s) => s.themePreference);
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference);
  const language = usePreferencesStore((s) => s.language);
  const setLanguagePref = usePreferencesStore((s) => s.setLanguage);
  const appVersion = Constants.expoConfig?.version ?? '—';

  const changeLanguage = async (next: AppLanguage): Promise<void> => {
    if (next === language) return;
    setLanguagePref(next);
    const { directionChanged } = await applyI18nLanguage(next);
    if (directionChanged) {
      toast.show({ message: tn('more.languageRestart'), tone: 'info', durationMs: 6000 });
    }
  };

  const logout = useLogoutMutation();
  const logoutAll = useLogoutAllMutation();
  const [confirm, setConfirm] = useState<Pending>('none');

  const name = user ? fullName(user.firstName, user.lastName) : '—';
  const busy = logout.isPending || logoutAll.isPending;

  return (
    <ScrollScreen>
      <AppHeader title={t('account.title')} />

      <Section spacing="xl">
        <Card>
          <Row gap="lg" align="flex-start">
            <Avatar name={name} size="avatarLg" />
            <View style={{ flex: 1, rowGap: 4 }}>
              <Text variant="subtitle" weight="bold">
                {name}
              </Text>
              <Caption>{user?.email}</Caption>
              {user?.phone ? <Caption>{user.phone}</Caption> : null}
              <Row gap="xs" wrap style={{ marginTop: theme.spacing.xs }}>
                {caps.isAdmin ? <Badge label="مدير" tone="primary" size="sm" /> : null}
                {caps.isModerator ? <Badge label="مشرف نظام" tone="info" size="sm" /> : null}
                {caps.supervisorDomains.map((d) => (
                  <Badge key={d} label={`مشرف ${d}`} tone="info" size="sm" />
                ))}
              </Row>
            </View>
          </Row>
        </Card>
      </Section>

      <Section spacing="xl">
        <Label>{t('vetStatus.label')}</Label>
        <Card variant="outlined" padding="md">
          <Row justify="space-between">
            <Text variant="bodyMedium">{t(`vetStatus.${vet.status}`)}</Text>
            <VeterinarianStatusBadge status={vet.status} size="md" />
          </Row>
        </Card>
      </Section>

      <Section spacing="xl">
        <Label>{t('mode.sectionTitle')}</Label>
        <Card variant="outlined" padding="md">
          <Row gap="sm">
            <View style={{ flex: 1 }}>
              <Button
                label={t('mode.owner')}
                variant={mode.activeMode === 'owner' ? 'primary' : 'ghost'}
                size="sm"
                fullWidth
                onPress={() => mode.setMode('owner')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('mode.veterinarian')}
                variant={mode.activeMode === 'veterinarian' ? 'primary' : 'ghost'}
                size="sm"
                fullWidth
                disabled={!mode.veterinarianModeAvailable}
                onPress={() => mode.setMode('veterinarian')}
              />
            </View>
          </Row>
          {mode.veterinarianLockReasonKey ? (
            <Caption style={{ marginTop: theme.spacing.sm }}>
              {t(mode.veterinarianLockReasonKey)}
            </Caption>
          ) : null}
        </Card>
      </Section>

      {caps.canAccessManagementArea ? (
        <Section spacing="xl">
          <Card variant="accent" onPress={() => router.push(Routes.managementHome)}>
            <Row gap="md">
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{t('account.management')}</Text>
                <Caption>{t('account.managementHint')}</Caption>
              </View>
              <Icon name="chevron-forward" directional color="primary" />
            </Row>
          </Card>
        </Section>
      ) : null}

      <Section spacing="xl">
        <Label>{tn('more.sectionApp')}</Label>
        <Card variant="outlined">
          <View style={{ rowGap: theme.spacing.sm }}>
            <Text variant="bodyMedium">{tn('more.language')}</Text>
            <Row gap="sm">
              <Chip
                label={tn('more.languageArabic')}
                selected={language === 'ar'}
                onPress={() => void changeLanguage('ar')}
              />
              <Chip
                label={tn('more.languageEnglish')}
                selected={language === 'en'}
                onPress={() => void changeLanguage('en')}
              />
            </Row>
          </View>
          <Divider spacing="md" />
          <Switch
            label="الوضع الداكن (تجريبي)"
            value={themePreference === 'dark'}
            onValueChange={(next) => setThemePreference(next ? 'dark' : 'light')}
          />
          <Divider spacing="md" />
          <TextButton
            label="نظام التصميم (للمطوّرين)"
            icon="color-palette-outline"
            onPress={() => router.push(Routes.showcase)}
          />
          <Divider spacing="md" />
          <Row justify="space-between">
            <Caption>{tn('more.version')}</Caption>
            <Caption>{appVersion}</Caption>
          </Row>
        </Card>
      </Section>

      <View style={{ rowGap: theme.spacing.md }}>
        <Button
          label={t('account.signOut')}
          variant="outline"
          leftIcon="log-out-outline"
          loading={logout.isPending}
          disabled={busy}
          onPress={() => setConfirm('one')}
        />
        <TextButton
          label={t('account.signOutAll')}
          tone="danger"
          icon="log-out-outline"
          disabled={busy}
          onPress={() => setConfirm('all')}
        />
      </View>

      <ConfirmationDialog
        visible={confirm !== 'none'}
        title={t('account.signOutConfirmTitle')}
        message={
          confirm === 'all' ? t('account.signOutAllConfirmBody') : t('account.signOutConfirmBody')
        }
        confirmLabel={confirm === 'all' ? t('account.signOutAll') : t('account.signOut')}
        cancelLabel="إلغاء"
        destructive
        loading={busy}
        onConfirm={() => {
          const which = confirm;
          setConfirm('none');
          if (which === 'all') logoutAll.mutate();
          else logout.mutate();
        }}
        onCancel={() => setConfirm('none')}
      />
    </ScrollScreen>
  );
}
