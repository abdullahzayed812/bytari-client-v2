import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card } from '@/components/content';
import { ConfirmationDialog, ErrorState, Loading, useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  ReasonPromptDialog,
  RenewalApproveDialog,
  RenewalRejectDialog,
  SubscriptionDatesDialog,
} from '../components';
import {
  useAdminFarmRenewals,
  useAdminOrganization,
  useAdminOrganizationMembers,
  useOrgDecisionMutation,
  useSetFarmSubscriptionMutation,
} from '../hooks';
import type { OrganizationStatus, OrgStatusAction, RenewalRequestStatus } from '../types';

function statusTone(s: OrganizationStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'ACTIVE') return 'success';
  if (s === 'PENDING') return 'info';
  if (s === 'SUSPENDED') return 'warning';
  return 'danger';
}

function renewalTone(s: RenewalRequestStatus): 'success' | 'warning' | 'danger' {
  if (s === 'APPROVED') return 'success';
  if (s === 'REJECTED') return 'danger';
  return 'warning';
}

type OrgPending = 'approve' | 'reject' | OrgStatusAction | null;

/** `/admin/farms/[organizationId]` — approval + subscription + renewal review for one farm. */
export default function AdminFarmDetailScreen() {
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();

  const q = useAdminOrganization(orgId);
  const membersQ = useAdminOrganizationMembers(orgId);
  const renewalsQ = useAdminFarmRenewals(orgId);
  const decide = useOrgDecisionMutation(orgId);
  const setSubscription = useSetFarmSubscriptionMutation(orgId);

  const [orgPending, setOrgPending] = useState<OrgPending>(null);
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  const fail = (e: unknown) => toast.show({ message: apiErrorMessage(e), tone: 'danger' });

  const runApprove = () =>
    decide.mutate(
      { decision: 'approve' },
      {
        onSuccess: () => {
          toast.show({ message: t('orgs.toast.approved'), tone: 'success' });
          setOrgPending(null);
        },
        onError: fail,
      },
    );
  const runReject = (reason: string) =>
    decide.mutate(
      { decision: 'reject', reason },
      {
        onSuccess: () => {
          toast.show({ message: t('orgs.toast.rejected'), tone: 'success' });
          setOrgPending(null);
        },
        onError: fail,
      },
    );
  const runStatus = (action: OrgStatusAction, reason?: string) =>
    decide.mutate(
      { decision: action, reason },
      {
        onSuccess: () => {
          toast.show({ message: t('orgs.toast.statusChanged'), tone: 'success' });
          setOrgPending(null);
        },
        onError: fail,
      },
    );

  const org = q.data;
  const supervisors = (membersQ.data ?? []).filter((m) => m.roleKey === 'SUPERVISOR');

  return (
    <ScrollScreen>
      <AppHeader title={t('farms.detail.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !org ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            <View style={{ rowGap: theme.spacing.xs }}>
              <Text variant="heading">{org.name}</Text>
              <View style={{ marginTop: 4 }}>
                <Badge
                  label={t(`orgs.status.${org.status}`)}
                  tone={statusTone(org.status)}
                  size="sm"
                />
              </View>
              {org.description ? (
                <Text variant="body" color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
                  {org.description}
                </Text>
              ) : null}
            </View>
          </Section>

          <Section spacing="lg">
            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.sm }}>
                <Row label={t('farms.detail.ownerLabel')} value={org.ownerUserId} />
                <Row
                  label={t('orgs.detail.createdLabel')}
                  value={new Date(org.createdAt).toLocaleDateString()}
                />
                {org.decisionReason ? (
                  <Row label={t('orgs.detail.decisionLabel')} value={org.decisionReason} />
                ) : null}
              </View>
            </Card>
          </Section>

          {/* Approval actions — same lifecycle every organization uses. */}
          <Section spacing="lg">
            <View style={{ rowGap: theme.spacing.sm }}>
              {org.status === 'PENDING' ? (
                <>
                  <Button
                    label={t('orgs.approve')}
                    variant="primary"
                    fullWidth
                    onPress={() => setOrgPending('approve')}
                  />
                  <Button
                    label={t('orgs.reject')}
                    variant="danger"
                    fullWidth
                    onPress={() => setOrgPending('reject')}
                  />
                </>
              ) : null}
              {org.status === 'ACTIVE' ? (
                <Button
                  label={t('orgs.suspend')}
                  variant="outline"
                  fullWidth
                  onPress={() => setOrgPending('suspend')}
                />
              ) : null}
              {org.status === 'SUSPENDED' || org.status === 'DEACTIVATED' ? (
                <Button
                  label={t('orgs.activate')}
                  variant="primary"
                  fullWidth
                  onPress={() => setOrgPending('activate')}
                />
              ) : null}
            </View>
          </Section>

          {/* Responsible supervisors — reuses the existing owner-side supervisor screen. */}
          <Section spacing="lg">
            <Label>{t('farms.detail.supervisorsSection')}</Label>
            {membersQ.isLoading ? (
              <Loading />
            ) : supervisors.length === 0 ? (
              <Caption>{t('farms.detail.noSupervisors')}</Caption>
            ) : (
              <View style={{ rowGap: theme.spacing.sm }}>
                {supervisors.map((m) => (
                  <Card key={m.id} variant="outlined" padding="md">
                    <Text variant="caption">
                      {`${m.user.firstName} ${m.user.lastName}`.trim() || m.user.email}
                    </Text>
                  </Card>
                ))}
              </View>
            )}
            <Button
              label={t('farms.detail.manageSupervisors')}
              variant="ghost"
              onPress={() => router.push(Routes.organizationSupervisors(orgId))}
            />
          </Section>

          {/* Subscription — separate from approval status. */}
          <Section spacing="lg">
            <Label>{t('farms.detail.subscriptionSection')}</Label>
            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.sm }}>
                <Row
                  label={t('farms.detail.subscriptionStartLabel')}
                  value={
                    org.details.subscriptionStartDate
                      ? formatDate(org.details.subscriptionStartDate)
                      : t('farms.detail.notSet')
                  }
                />
                <Row
                  label={t('farms.detail.subscriptionEndLabel')}
                  value={
                    org.details.subscriptionEndDate
                      ? formatDate(org.details.subscriptionEndDate)
                      : t('farms.detail.notSet')
                  }
                />
                {org.details.subscriptionStatus ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Caption>{t('farms.detail.subscriptionStatusLabel')}</Caption>
                    <Badge
                      label={t(`farms.subscriptionStatus.${org.details.subscriptionStatus}`)}
                      tone={org.details.subscriptionStatus === 'EXPIRED' ? 'danger' : 'success'}
                      size="sm"
                    />
                  </View>
                ) : null}
              </View>
            </Card>
            <Button
              label={t('farms.detail.setSubscription')}
              variant="outline"
              onPress={() => setSubscriptionDialog(true)}
            />
          </Section>

          {/* Renewal requests — the owner-submits/admin-reviews workflow. */}
          <Section spacing="huge">
            <Label>{t('farms.detail.renewalsSection')}</Label>
            {renewalsQ.isLoading ? (
              <Loading />
            ) : renewalsQ.requests.length === 0 ? (
              <Caption>{t('farms.detail.noRenewals')}</Caption>
            ) : (
              <View style={{ rowGap: theme.spacing.sm }}>
                {renewalsQ.requests.map((r) => (
                  <Card key={r.id} variant="outlined" padding="md">
                    <View style={{ rowGap: theme.spacing.xs }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Caption>{formatDate(r.createdAt)}</Caption>
                        <Badge
                          label={t(`farms.detail.requestStatus.${r.status}`)}
                          tone={renewalTone(r.status)}
                          size="sm"
                        />
                      </View>
                      {r.note ? (
                        <Text variant="caption">
                          {t('farms.detail.renewalNote')}: {r.note}
                        </Text>
                      ) : null}
                      {r.status === 'PENDING' ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            columnGap: theme.spacing.sm,
                            marginTop: theme.spacing.xs,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Button
                              label={t('farms.detail.approveRenewal')}
                              variant="primary"
                              size="sm"
                              fullWidth
                              onPress={() => setApprovingRequestId(r.id)}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Button
                              label={t('farms.detail.rejectRenewal')}
                              variant="danger"
                              size="sm"
                              fullWidth
                              onPress={() => setRejectingRequestId(r.id)}
                            />
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </Section>
        </>
      )}

      <ConfirmationDialog
        visible={orgPending === 'approve'}
        title={t('orgs.approveTitle')}
        message={t('orgs.approveBody')}
        confirmLabel={t('orgs.approve')}
        cancelLabel={t('common.cancel')}
        loading={decide.isPending}
        onConfirm={runApprove}
        onCancel={() => setOrgPending(null)}
      />
      <ReasonPromptDialog
        visible={orgPending === 'reject'}
        title={t('orgs.rejectTitle')}
        message={t('orgs.rejectBody')}
        label={t('orgs.reasonLabel')}
        placeholder={t('orgs.reasonPlaceholder')}
        confirmLabel={t('orgs.reject')}
        cancelLabel={t('common.cancel')}
        required
        destructive
        loading={decide.isPending}
        onConfirm={runReject}
        onCancel={() => setOrgPending(null)}
      />
      <ReasonPromptDialog
        visible={
          orgPending === 'suspend' || orgPending === 'activate' || orgPending === 'deactivate'
        }
        title={t('orgs.statusTitle')}
        message={t('orgs.statusBody')}
        label={t('orgs.reasonLabel')}
        placeholder={t('orgs.reasonPlaceholder')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        destructive={orgPending === 'suspend' || orgPending === 'deactivate'}
        loading={decide.isPending}
        onConfirm={(reason) => {
          if (
            orgPending === 'suspend' ||
            orgPending === 'activate' ||
            orgPending === 'deactivate'
          ) {
            runStatus(orgPending, reason || undefined);
          }
        }}
        onCancel={() => setOrgPending(null)}
      />

      <SubscriptionDatesDialog
        visible={subscriptionDialog}
        title={t('farms.detail.setSubscriptionTitle')}
        confirmLabel={t('farms.detail.save')}
        loading={setSubscription.isPending}
        onConfirm={(dates) =>
          setSubscription.mutate(dates, {
            onSuccess: () => {
              toast.show({ message: t('farms.toast.subscriptionSet'), tone: 'success' });
              setSubscriptionDialog(false);
            },
            onError: fail,
          })
        }
        onCancel={() => setSubscriptionDialog(false)}
      />

      <RenewalApproveDialog
        visible={approvingRequestId !== null}
        organizationId={orgId}
        requestId={approvingRequestId}
        onDone={() => {
          toast.show({ message: t('farms.toast.renewalApproved'), tone: 'success' });
          setApprovingRequestId(null);
        }}
        onError={fail}
        onCancel={() => setApprovingRequestId(null)}
      />

      <RenewalRejectDialog
        visible={rejectingRequestId !== null}
        organizationId={orgId}
        requestId={rejectingRequestId}
        onDone={() => {
          toast.show({ message: t('farms.toast.renewalRejected'), tone: 'success' });
          setRejectingRequestId(null);
        }}
        onError={fail}
        onCancel={() => setRejectingRequestId(null)}
      />
    </ScrollScreen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: 12 }}>
      <Caption>{label}</Caption>
      <Text variant="caption" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

