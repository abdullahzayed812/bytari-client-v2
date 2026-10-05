import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Card, Icon, type IconName } from '@/components/content';
import { ConfirmationDialog } from '@/components/feedback';
import { ScrollScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useLogoutAllMutation } from '@/features/auth';
import { useAuth } from '@/hooks';
import { useTheme } from '@/theme';

/**
 * Route `/(app)/settings/privacy` — "الخصوصية والأمان" (both interfaces).
 *
 * Security: change password (`POST /auth/change-password`) and sign out of
 * every device (`POST /auth/logout-all`). Privacy: an accurate statement of
 * what other users can see — it mirrors the server: the public user directory
 * (`GET /users/:id`) exposes only name / avatar / specialization / verification
 * status; email, phone, WhatsApp and bio are only ever returned to their owner.
 */
export default function PrivacySecurityScreen() {
  const theme = useTheme();
  const { t } = useTranslation('settings');
  const { user } = useAuth();
  const logoutAll = useLogoutAllMutation();
  const [confirm, setConfirm] = useState(false);

  return (
    <ScrollScreen padded={false}>
      <AppHeader title={t('privacy.title')} showBack />
      <View
        style={{
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.md,
          rowGap: theme.spacing.md,
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
        }}
      >
        <Text variant="bodyStrong">{t('privacy.securityTitle')}</Text>
        <ActionRow
          icon="key-outline"
          label={t('rows.changePassword')}
          hint={t('privacy.changePasswordHint')}
          onPress={() => router.push(Routes.settingsChangePassword)}
        />
        <ActionRow
          icon="log-out-outline"
          label={t('privacy.signOutAll')}
          hint={t('privacy.signOutAllHint')}
          danger
          onPress={() => setConfirm(true)}
        />
        {user?.email ? (
          <Card padding="lg">
            <Caption color="textSecondary">{t('privacy.accountEmail')}</Caption>
            <Text variant="bodyMedium">{user.email}</Text>
          </Card>
        ) : null}

        <Text variant="bodyStrong" style={{ marginTop: theme.spacing.md }}>
          {t('privacy.privacyTitle')}
        </Text>
        <InfoCard
          icon="eye-outline"
          title={t('privacy.visibleTitle')}
          body={t('privacy.visibleBody')}
        />
        <InfoCard
          icon="lock-closed-outline"
          title={t('privacy.hiddenTitle')}
          body={t('privacy.hiddenBody')}
        />
        <Caption color="textMuted">{t('privacy.contactShared')}</Caption>
      </View>

      <ConfirmationDialog
        visible={confirm}
        title={t('privacy.signOutAllConfirmTitle')}
        message={t('privacy.signOutAllConfirmBody')}
        confirmLabel={t('privacy.signOutAll')}
        cancelLabel={t('cancel')}
        destructive
        loading={logoutAll.isPending}
        onConfirm={() => {
          setConfirm(false);
          logoutAll.mutate();
        }}
        onCancel={() => setConfirm(false)}
      />
    </ScrollScreen>
  );
}

function ActionRow({
  icon,
  label,
  hint,
  danger,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Card padding="lg">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}
      >
        <Icon name={icon} size="iconMd" color={danger ? 'danger' : 'primary'} />
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyMedium" color={danger ? 'danger' : undefined}>
            {label}
          </Text>
          <Caption color="textSecondary">{hint}</Caption>
        </View>
        <Icon name="chevron-forward" size="iconSm" color="textMuted" directional />
      </Pressable>
    </Card>
  );
}

function InfoCard({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const theme = useTheme();
  return (
    <Card padding="lg" variant="outlined">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.md }}>
        <Icon name={icon} size="iconMd" color="primary" />
        <View style={{ flex: 1, rowGap: 4 }}>
          <Text variant="bodyMedium">{title}</Text>
          <Caption color="textSecondary">{body}</Caption>
        </View>
      </View>
    </Card>
  );
}
