import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useVeterinarianApplicationStatus } from '@/features/veterinarian';
import { useAuth } from '@/hooks';
import { useTheme } from '@/theme';

/** How often the screen re-checks for an admin decision while it is open. */
const POLL_MS = 30_000;

/**
 * Route `/(auth)/veterinarian-pending` — the ONLY screen a veterinarian-registered
 * account sees until an admin approves its application (`AuthStatus`
 * `'pending-approval'`). `AuthRedirector` pins the user here; the server
 * independently refuses every non-onboarding API (403
 * `VETERINARIAN_ACCOUNT_PENDING_APPROVAL`), so leaving this screen by any other
 * means gains nothing.
 *
 *   NOT_APPLIED → the application was never submitted (e.g. the app closed
 *                 mid-registration) — link to finish it.
 *   PENDING     → under review; wait for the admin.
 *   REJECTED    → show the reason; allow re-applying.
 *
 * It re-pulls `/auth/me` on open, on foreground, every 30s and on demand — the
 * moment `accessState` becomes FULL, `AuthRedirector` moves the user into the app.
 */
export default function VeterinarianPendingApprovalScreen() {
  const theme = useTheme();
  const { t } = useTranslation('registration');
  const { session, refreshSession, logout, requiresVeterinarianApproval } = useAuth();
  const statusQ = useVeterinarianApplicationStatus({ enabled: requiresVeterinarianApproval });
  const [checking, setChecking] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const status = statusQ.data?.veterinarianStatus ?? session?.veterinarian.status ?? 'PENDING';
  const reason = statusQ.data?.application?.decisionReason ?? null;
  const { refetch } = statusQ;

  const check = useCallback(async () => {
    await Promise.all([refreshSession(), refetch()]);
  }, [refreshSession, refetch]);

  useEffect(() => {
    const interval = setInterval(() => void check(), POLL_MS);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void check();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [check]);

  const onCheck = async () => {
    setChecking(true);
    try {
      await check();
    } finally {
      setChecking(false);
    }
  };

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const variant = status === 'REJECTED' ? 'rejected' : status === 'NOT_APPLIED' ? 'incomplete' : 'pending';
  const tone =
    variant === 'rejected'
      ? { bg: theme.colors.dangerSoft, fg: 'danger' as const, icon: 'close-circle-outline' as const }
      : variant === 'incomplete'
        ? { bg: theme.colors.warningSoft, fg: 'warning' as const, icon: 'document-text-outline' as const }
        : { bg: theme.colors.warningSoft, fg: 'warning' as const, icon: 'time-outline' as const };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: theme.screenPadding,
          paddingVertical: theme.spacing.xxxl,
          justifyContent: 'space-between',
          rowGap: theme.spacing.xxl,
        }}
      >
        <View style={{ alignItems: 'center', rowGap: theme.spacing.xl }}>
          <View
            style={{
              width: 112,
              height: 112,
              borderRadius: theme.radius.xxl,
              backgroundColor: tone.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={tone.icon} size={56} color={tone.fg} />
          </View>

          <View style={{ alignItems: 'center', rowGap: theme.spacing.sm }}>
            <Heading level={2} center>
              {t(`vetPending.${variant}.title`)}
            </Heading>
            <Caption center style={{ maxWidth: 340 }}>
              {t(`vetPending.${variant}.body`)}
            </Caption>
          </View>

          {variant === 'pending' ? (
            <Card variant="outlined" padding="md" style={{ alignSelf: 'stretch' }}>
              <View style={{ rowGap: theme.spacing.sm }}>
                {(['submitted', 'underReview', 'waitAdmin', 'afterApproval'] as const).map((k) => (
                  <View key={k} style={{ flexDirection: 'row', columnGap: theme.spacing.sm, alignItems: 'flex-start' }}>
                    <Icon name="checkmark-circle-outline" size="iconSm" color="primary" />
                    <Text variant="body" style={{ flex: 1 }}>
                      {t(`vetPending.pending.points.${k}`)}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}

          {variant === 'rejected' && reason ? (
            <Card variant="outlined" padding="md" style={{ alignSelf: 'stretch' }}>
              <View style={{ rowGap: theme.spacing.xs }}>
                <Label>{t('vetPending.rejected.reasonLabel')}</Label>
                <Text variant="body">{reason}</Text>
              </View>
            </Card>
          ) : null}
        </View>

        <View style={{ rowGap: theme.spacing.md }}>
          {variant === 'pending' ? (
            <Button
              label={t('vetPending.checkStatus')}
              fullWidth
              leftIcon="refresh-outline"
              loading={checking}
              onPress={() => void onCheck()}
            />
          ) : (
            <Button
              label={t(variant === 'rejected' ? 'vetPending.rejected.reapply' : 'vetPending.incomplete.complete')}
              fullWidth
              onPress={() => router.push(Routes.veterinarianApply)}
            />
          )}
          <Button
            label={t('vetPending.logout')}
            variant="outline"
            fullWidth
            leftIcon="log-out-outline"
            loading={loggingOut}
            onPress={() => void onLogout()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
