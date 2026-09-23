import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card } from '@/components/content';
import { ConfirmationDialog, ErrorState, Loading, useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { ReasonPromptDialog, SubscriptionDatesDialog } from '../components';
import {
  useAdminOrganization,
  useAdminOrganizationMembers,
  useOrgDecisionMutation,
  useSetFarmSubscriptionMutation,
} from '../hooks';
import type { OrganizationStatus, OrgStatusAction } from '../types';

/** Subscription management is generalized to these two org types too — see `FarmSubscriptionRenewalRepository`. */
const SUBSCRIPTION_CAPABLE_TYPES = new Set(['VETERINARY_OFFICE', 'CLINIC']);

function statusTone(s: OrganizationStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'ACTIVE') return 'success';
  if (s === 'PENDING') return 'info';
  if (s === 'SUSPENDED') return 'warning';
  return 'danger';
}

type Pending = 'approve' | 'reject' | OrgStatusAction | null;

export default function AdminOrganizationDetailScreen() {
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();

  const q = useAdminOrganization(organizationId);
  const membersQ = useAdminOrganizationMembers(organizationId);
  const decide = useOrgDecisionMutation(organizationId);
  const setSubscription = useSetFarmSubscriptionMutation(organizationId);
  const [pending, setPending] = useState<Pending>(null);
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  const done = (message: string) => {
    toast.show({ message, tone: 'success' });
    setPending(null);
  };
  const fail = (e: unknown) => toast.show({ message: apiErrorMessage(e), tone: 'danger' });

  const runApprove = () =>
    decide.mutate(
      { decision: 'approve' },
      { onSuccess: () => done(t('orgs.toast.approved')), onError: fail },
    );
  const runReject = (reason: string) =>
    decide.mutate(
      { decision: 'reject', reason },
      { onSuccess: () => done(t('orgs.toast.rejected')), onError: fail },
    );
  const runStatus = (action: OrgStatusAction, reason?: string) =>
    decide.mutate(
      { decision: action, reason },
      { onSuccess: () => done(t('orgs.toast.statusChanged')), onError: fail },
    );

  const org = q.data;

  return (
    <ScrollScreen>
      <AppHeader title={t('orgs.detail.title')} showBack />

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
              <Caption>{t(`orgs.type.${org.type}`)}</Caption>
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

          {(org.details.galleryUrls?.length ?? 0) > 0 ||
          (org.details.licenseDocumentUrls?.length ?? 0) > 0 ? (
            <Section spacing="lg">
              <Label>{t('orgs.detail.imagesSection')}</Label>
              <View style={{ rowGap: theme.spacing.md }}>
                {org.details.galleryUrls && org.details.galleryUrls.length > 0 ? (
                  <View style={{ rowGap: theme.spacing.sm }}>
                    <Caption>{t('orgs.detail.galleryTitle')}</Caption>
                    <ImageThumbnailRow
                      images={org.details.galleryUrls}
                      onPress={(index) => setViewer({ images: org.details.galleryUrls ?? [], index })}
                    />
                  </View>
                ) : null}
                {SUBSCRIPTION_CAPABLE_TYPES.has(org.type) &&
                org.details.licenseDocumentUrls &&
                org.details.licenseDocumentUrls.length > 0 ? (
                  <View style={{ rowGap: theme.spacing.sm }}>
                    <Caption>{t('orgs.detail.licenseImagesTitle')}</Caption>
                    <ImageThumbnailRow
                      images={org.details.licenseDocumentUrls}
                      onPress={(index) =>
                        setViewer({ images: org.details.licenseDocumentUrls ?? [], index })
                      }
                    />
                  </View>
                ) : null}
              </View>
            </Section>
          ) : null}

          <Section spacing="lg">
            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.sm }}>
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

          {SUBSCRIPTION_CAPABLE_TYPES.has(org.type) ? (
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
          ) : null}

          <Section spacing="lg">
            <Label>{t('orgs.detail.membersSection')}</Label>
            {membersQ.isLoading ? (
              <Loading />
            ) : membersQ.data && membersQ.data.length > 0 ? (
              <View style={{ rowGap: theme.spacing.sm }}>
                {membersQ.data.map((m) => (
                  <Card key={m.id} variant="outlined" padding="md">
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text variant="caption" style={{ flex: 1 }} numberOfLines={1}>
                        {`${m.user.firstName} ${m.user.lastName}`.trim() || m.user.email}
                      </Text>
                      <Badge label={m.roleKey} tone="neutral" size="sm" />
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Caption>{t('orgs.detail.noMembers')}</Caption>
            )}
          </Section>

          {org.type === 'CHAT_ROOM' ? (
            <Section spacing="lg">
              <Label>{t('orgs.chatRoom.section')}</Label>
              <View style={{ rowGap: theme.spacing.sm }}>
                <Button
                  label={t('orgs.chatRoom.edit')}
                  variant="outline"
                  fullWidth
                  onPress={() => router.push(Routes.organizationEdit(org.id))}
                />
                <Button
                  label={t('orgs.chatRoom.editRules')}
                  variant="outline"
                  fullWidth
                  onPress={() => router.push(Routes.globalChatRoomEditRules(org.id))}
                />
                <Button
                  label={t('orgs.chatRoom.manageModerators')}
                  variant="outline"
                  fullWidth
                  onPress={() => router.push(Routes.organizationSupervisors(org.id))}
                />
                <Button
                  label={t('orgs.chatRoom.manageMembers')}
                  variant="outline"
                  fullWidth
                  onPress={() => router.push(Routes.organizationMembers(org.id))}
                />
              </View>
            </Section>
          ) : null}

          {org.type === 'SYNDICATE' ? (
            <Section spacing="lg">
              <Label>{t('orgs.syndicate.section')}</Label>
              <View style={{ rowGap: theme.spacing.sm }}>
                <Button
                  label={t('orgs.syndicate.viewBranches')}
                  variant="outline"
                  fullWidth
                  onPress={() => router.push(Routes.syndicateBranches(org.id))}
                />
                <Button
                  label={t('orgs.syndicate.viewAnnouncements')}
                  variant="outline"
                  fullWidth
                  onPress={() => router.push(Routes.syndicateAnnouncements(org.id))}
                />
                <Button
                  label={t('orgs.syndicate.addAnnouncement')}
                  variant="primary"
                  fullWidth
                  onPress={() => router.push(Routes.syndicateAnnouncementNew(org.id))}
                />
              </View>
            </Section>
          ) : null}

          <Section spacing="lg">
            <View style={{ rowGap: theme.spacing.sm }}>
              {org.status === 'PENDING' ? (
                <>
                  <Button
                    label={t('orgs.approve')}
                    variant="primary"
                    fullWidth
                    onPress={() => setPending('approve')}
                  />
                  <Button
                    label={t('orgs.reject')}
                    variant="danger"
                    fullWidth
                    onPress={() => setPending('reject')}
                  />
                </>
              ) : null}
              {org.status === 'ACTIVE' ? (
                <Button
                  label={t('orgs.suspend')}
                  variant="outline"
                  fullWidth
                  onPress={() => setPending('suspend')}
                />
              ) : null}
              {org.status === 'SUSPENDED' || org.status === 'DEACTIVATED' ? (
                <Button
                  label={t('orgs.activate')}
                  variant="primary"
                  fullWidth
                  onPress={() => setPending('activate')}
                />
              ) : null}
              {org.status !== 'PENDING' &&
              org.status !== 'REJECTED' &&
              org.status !== 'DEACTIVATED' ? (
                <Button
                  label={t('orgs.deactivate')}
                  variant="danger"
                  fullWidth
                  onPress={() => setPending('deactivate')}
                />
              ) : null}
            </View>
          </Section>
        </>
      )}

      <ConfirmationDialog
        visible={pending === 'approve'}
        title={t('orgs.approveTitle')}
        message={t('orgs.approveBody')}
        confirmLabel={t('orgs.approve')}
        cancelLabel={t('common.cancel')}
        loading={decide.isPending}
        onConfirm={runApprove}
        onCancel={() => setPending(null)}
      />

      <ReasonPromptDialog
        visible={pending === 'reject'}
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
        onCancel={() => setPending(null)}
      />

      <ReasonPromptDialog
        visible={pending === 'suspend' || pending === 'activate' || pending === 'deactivate'}
        title={t('orgs.statusTitle')}
        message={t('orgs.statusBody')}
        label={t('orgs.reasonLabel')}
        placeholder={t('orgs.reasonPlaceholder')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        destructive={pending === 'suspend' || pending === 'deactivate'}
        loading={decide.isPending}
        onConfirm={(reason) => {
          if (pending === 'suspend' || pending === 'activate' || pending === 'deactivate') {
            runStatus(pending, reason || undefined);
          }
        }}
        onCancel={() => setPending(null)}
      />

      <SubscriptionDatesDialog
        visible={subscriptionDialog}
        title={t('orgs.detail.setSubscriptionTitle')}
        confirmLabel={t('farms.detail.setSubscription')}
        loading={setSubscription.isPending}
        onConfirm={(dates) =>
          setSubscription.mutate(dates, {
            onSuccess: () => {
              toast.show({ message: t('farms.toast.subscriptionSet'), tone: 'success' });
              setSubscriptionDialog(false);
              void q.refetch();
            },
            onError: fail,
          })
        }
        onCancel={() => setSubscriptionDialog(false)}
      />

      <ImageViewer
        visible={viewer !== null}
        images={viewer?.images ?? []}
        initialIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
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
