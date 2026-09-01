import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Icon } from '@/components/content';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { VeterinarianStatusBadge, useVeterinarianStatus } from '@/features/auth';
import { useConversations } from '@/features/chat/hooks';
import { useUnreadCount } from '@/features/notifications/hooks';
import { useOrganizations } from '@/features/organizations';
import { useAppMode, useAuth, useCapabilities } from '@/hooks';
import { useAppHeaderGreeting } from '@/navigation/useAppHeaderGreeting';
import { useTheme } from '@/theme';

import { useVeterinarianApplicationStatus } from '../hooks';

/**
 * Veterinarian Home (§3/§4). Shown by the Home tab when `activeMode` is
 * `veterinarian`. Pet Owner Mode is untouched — switching back returns the user
 * to the Pet Owner Home with all pet features intact.
 *
 * The screen is capability-aware: an APPROVED vet sees organization management;
 * a PENDING / REJECTED / not-applied user sees a clear status + the apply path.
 * The backend remains the authority for every action.
 */
export default function VeterinarianHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinarian');
  const { t: tk } = useTranslation('content');
  const { t: ts } = useTranslation('support');
  const { t: tn } = useTranslation('notifications');
  const { t: tch } = useTranslation('chat');
  const caps = useCapabilities();
  const greeting = useAppHeaderGreeting();
  const { user } = useAuth();
  const mode = useAppMode();
  const vet = useVeterinarianStatus();
  const appStatus = useVeterinarianApplicationStatus({ enabled: vet.hasApplied });

  const orgs = useOrganizations({ pageSize: 1, enabled: vet.isApproved });
  const { data: unread = 0 } = useUnreadCount();
  const { unreadTotal: chatUnread } = useConversations({ pageSize: 20 });
  const rejectionReason = vet.isRejected
    ? (appStatus.data?.application?.decisionReason ?? null)
    : null;

  return (
    <ScrollScreen>
      <Section spacing="xl">
        <Row justify="space-between" align="flex-start">
          <View style={{ flex: 1 }}>
            <Caption>{greeting}</Caption>
            <Heading level={2} numberOfLines={1}>
              {user ? `${user.firstName} ${user.lastName}`.trim() : t('title')}
            </Heading>
          </View>
          <View
            style={{
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surfaceAccent,
            }}
          >
            <Text variant="overline" color="primary">
              {t('modeChip')}
            </Text>
          </View>
        </Row>
      </Section>

      {/* Veterinarian approval status */}
      <Section spacing="xl">
        <Label>{t('status.label')}</Label>
        <Card variant="outlined" padding="md">
          <Row justify="space-between">
            <Text variant="bodyMedium">{t(`status.${vet.status}`)}</Text>
            <VeterinarianStatusBadge status={vet.status} size="md" />
          </Row>

          {vet.isPending ? (
            <Caption style={{ marginTop: theme.spacing.sm }}>{t('status.pendingHint')}</Caption>
          ) : null}

          {vet.isRejected ? (
            <View style={{ marginTop: theme.spacing.sm, rowGap: theme.spacing.xs }}>
              <Caption>{t('status.rejectedHint')}</Caption>
              {rejectionReason ? (
                <Text variant="caption" color="danger">
                  {t('status.rejectionReason', { reason: rejectionReason })}
                </Text>
              ) : null}
            </View>
          ) : null}

          {!vet.isApproved && !vet.isPending ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <Button
                label={vet.isRejected ? t('apply.reapplyCta') : t('apply.cta')}
                variant="primary"
                size="sm"
                onPress={() => router.push(Routes.veterinarianApply)}
              />
            </View>
          ) : null}
        </Card>
      </Section>

      {/* Organization management — approved vets only */}
      {vet.isApproved ? (
        <Section spacing="xl">
          <Label>{t('organizations.label')}</Label>
          <Card variant="accent" onPress={() => router.push(Routes.organizations)}>
            <Row gap="md">
              <Icon name="business-outline" size="iconLg" color="primary" />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{t('organizations.myOrganizations')}</Text>
                <Caption>
                  {orgs.isLoading
                    ? t('organizations.loading')
                    : t('organizations.count', { count: orgs.total })}
                </Caption>
              </View>
              <Icon name="chevron-forward" directional color="primary" />
            </Row>
          </Card>

          <View style={{ marginTop: theme.spacing.md, rowGap: theme.spacing.sm }}>
            <Button
              label={t('organizations.createCta')}
              variant="outline"
              leftIcon="add"
              fullWidth
              onPress={() => router.push(Routes.organizationsCreate)}
            />
            <Button
              label={t('organizations.joinFarmCta')}
              variant="outline"
              leftIcon="key-outline"
              fullWidth
              onPress={() => router.push(Routes.veterinarianJoinFarm)}
            />
          </View>
        </Section>
      ) : null}

      {/* Notifications inbox (Phase 15) */}
      <Section spacing="xl">
        <Card
          variant="outlined"
          padding="md"
          onPress={() => router.push(Routes.notifications)}
          accessibilityLabel={
            unread > 0 ? tn('bell.a11yWithCount', { count: unread }) : tn('bell.a11y')
          }
        >
          <Row gap="md">
            <Icon name="notifications-outline" size="iconMd" color="primary" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{tn('home.title')}</Text>
              <Caption>
                {unread > 0 ? tn('home.unread', { count: unread }) : tn('home.hint')}
              </Caption>
            </View>
            {unread > 0 ? (
              <Badge label={unread > 99 ? '99+' : String(unread)} tone="danger" size="sm" />
            ) : (
              <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
            )}
          </Row>
        </Card>
      </Section>

      {/* Chat (Final Completion phase) */}
      <Section spacing="xl">
        <Card
          variant="outlined"
          padding="md"
          onPress={() => router.push(Routes.chat)}
          accessibilityLabel={
            chatUnread > 0 ? tch('list.a11yUnread', { count: chatUnread }) : tch('home.title')
          }
        >
          <Row gap="md">
            <Icon name="chatbubbles-outline" size="iconMd" color="primary" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{tch('home.title')}</Text>
              <Caption>
                {chatUnread > 0 ? tch('home.unread', { count: chatUnread }) : tch('home.hint')}
              </Caption>
            </View>
            {chatUnread > 0 ? (
              <Badge label={chatUnread > 99 ? '99+' : String(chatUnread)} tone="danger" size="sm" />
            ) : (
              <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
            )}
          </Row>
        </Card>
      </Section>

      {/* Content & Knowledge (Phase 11) */}
      <Section spacing="xl">
        <Card
          variant="outlined"
          padding="md"
          onPress={() => router.push(Routes.contentHome)}
          accessibilityLabel={tk('home.title')}
        >
          <Row gap="md">
            <Icon name="library-outline" size="iconMd" color="primary" />
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              {tk('home.title')}
            </Text>
            <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
          </Row>
        </Card>
      </Section>

      {/* Consultations & Inquiries (Phase 13) */}
      <Section spacing="xl">
        <Label>{ts('home.sectionTitle')}</Label>
        <View style={{ rowGap: theme.spacing.sm }}>
          {(
            [
              {
                slug: 'consultations',
                icon: 'chatbubbles-outline',
                label: ts('home.consultations'),
              },
              { slug: 'inquiries', icon: 'help-buoy-outline', label: ts('home.inquiries') },
            ] as const
          ).map((item) => (
            <Card
              key={item.slug}
              variant="outlined"
              padding="md"
              onPress={() => router.push(Routes.support(item.slug))}
              accessibilityLabel={item.label}
            >
              <Row gap="md">
                <Icon name={item.icon} size="iconMd" color="primary" />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {item.label}
                </Text>
                <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
              </Row>
            </Card>
          ))}
          {caps.isAdmin ||
          caps.isSupervisorOf('CONSULTATION') ||
          caps.can('consultation.admin.read') ? (
            <Card
              variant="outlined"
              padding="md"
              onPress={() => router.push(Routes.supportManage('consultations'))}
              accessibilityLabel={ts('home.manageConsultations')}
            >
              <Row gap="md">
                <Icon name="shield-checkmark-outline" size="iconMd" color="primary" />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {ts('home.manageConsultations')}
                </Text>
                <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
              </Row>
            </Card>
          ) : null}
          {caps.isAdmin || caps.isSupervisorOf('INQUIRY') || caps.can('inquiry.admin.read') ? (
            <Card
              variant="outlined"
              padding="md"
              onPress={() => router.push(Routes.supportManage('inquiries'))}
              accessibilityLabel={ts('home.manageInquiries')}
            >
              <Row gap="md">
                <Icon name="shield-checkmark-outline" size="iconMd" color="primary" />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {ts('home.manageInquiries')}
                </Text>
                <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
              </Row>
            </Card>
          ) : null}
        </View>
      </Section>

      {/* Switch back to Pet Owner Mode */}
      <Section spacing="xl">
        <Card variant="outlined" padding="md">
          <Row gap="md">
            <Icon name="swap-horizontal-outline" size="iconMd" color="textSecondary" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{t('switchToOwner.title')}</Text>
              <Caption>{t('switchToOwner.hint')}</Caption>
            </View>
            <Button
              label={t('switchToOwner.action')}
              variant="ghost"
              size="sm"
              onPress={() => mode.setMode('owner')}
            />
          </Row>
        </Card>
      </Section>

      {/* Account access */}
      <Section spacing="giant">
        <Card variant="outlined" padding="md" onPress={() => router.push(Routes.account)}>
          <Row gap="md">
            <Icon name="person-circle-outline" size="iconMd" color="textSecondary" />
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              {t('account')}
            </Text>
            <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
          </Row>
        </Card>
      </Section>
    </ScrollScreen>
  );
}
