import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Avatar, Badge, Card, Divider } from '@/components/content';
import { ConfirmationDialog } from '@/components/feedback';
import { Switch } from '@/components/forms';
import { ScrollScreen, Row, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { useAppMode, useAuth, useCapabilities } from '@/hooks';
import { usePreferencesStore } from '@/store';
import { useTheme } from '@/theme';

/**
 * Account tab. In Phase 1 this is where the foundation seams surface for manual
 * verification: session info, mode switching, control-centre entry, theme
 * toggle, sign-out. Real account management is a later phase.
 */
export default function AccountTab() {
  const theme = useTheme();
  const { user, session, signOut } = useAuth();
  const caps = useCapabilities();
  const { activeMode, canSwitchMode, setMode } = useAppMode();
  const themePreference = usePreferencesStore((s) => s.themePreference);
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '—';

  return (
    <ScrollScreen>
      <AppHeader title="حسابي" />

      <Section spacing="xl">
        <Card>
          <Row gap="lg">
            <Avatar name={fullName} size="avatarLg" />
            <View style={{ flex: 1, rowGap: 2 }}>
              <Text variant="subtitle" weight="bold">
                {fullName}
              </Text>
              <Caption>{user?.email}</Caption>
              <Row gap="xs" wrap style={{ marginTop: theme.spacing.xs }}>
                {caps.isAdmin ? <Badge label="مدير" tone="primary" size="sm" /> : null}
                {caps.isApprovedVeterinarian ? (
                  <Badge label="طبيب معتمد" tone="success" size="sm" />
                ) : caps.isVeterinarianAccount ? (
                  <Badge
                    label={`طبيب — ${session?.veterinarian.status ?? ''}`}
                    tone="warning"
                    size="sm"
                  />
                ) : null}
                {caps.supervisorDomains.map((d) => (
                  <Badge key={d} label={`مشرف ${d}`} tone="info" size="sm" />
                ))}
              </Row>
            </View>
          </Row>
        </Card>
      </Section>

      {canSwitchMode ? (
        <Section spacing="xl">
          <Text variant="label" color="textSecondary">
            وضع التطبيق
          </Text>
          <Card variant="outlined" padding="md">
            <Row gap="sm">
              <Button
                label="صاحب حيوان"
                variant={activeMode === 'owner' ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => setMode('owner')}
              />
              <Button
                label="طبيب بيطري"
                variant={activeMode === 'veterinarian' ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => setMode('veterinarian')}
              />
            </Row>
          </Card>
        </Section>
      ) : null}

      {caps.canAccessControlCentre ? (
        <Section spacing="xl">
          <Card variant="accent" onPress={() => router.push('/(app)/admin')}>
            <Row gap="md">
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">مركز التحكم</Text>
                <Caption>إدارة النظام والإشراف</Caption>
              </View>
              <Text variant="title" color="primary">
                ‹
              </Text>
            </Row>
          </Card>
        </Section>
      ) : null}

      <Section spacing="xl">
        <Card variant="outlined">
          <Switch
            label="الوضع الداكن (تجريبي)"
            value={themePreference === 'dark'}
            onValueChange={(next) => setThemePreference(next ? 'dark' : 'light')}
          />
          <Divider spacing="md" />
          <TextButton
            label="نظام التصميم (للمطوّرين)"
            icon="color-palette-outline"
            onPress={() => router.push('/(app)/showcase')}
          />
        </Card>
      </Section>

      <Button
        label="تسجيل الخروج"
        variant="outline"
        leftIcon="log-out-outline"
        onPress={() => setConfirmSignOut(true)}
      />

      <ConfirmationDialog
        visible={confirmSignOut}
        title="تسجيل الخروج"
        message="هل تريد إنهاء الجلسة الحالية؟"
        confirmLabel="خروج"
        cancelLabel="إلغاء"
        destructive
        onConfirm={() => {
          setConfirmSignOut(false);
          void signOut();
        }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </ScrollScreen>
  );
}
