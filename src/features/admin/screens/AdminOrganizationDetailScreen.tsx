import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Icon } from '@/components/content';
import { ConfirmationDialog, ErrorState, Loading, useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { termsKeyForOrganization } from '@/features/organizations/constants';
import { useOrganizationTerms } from '@/features/organizations/hooks/useOrganizationTerms';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate, formatDateTime, fullName } from '@/utils';

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
import type { AdminTermsAcceptance, OrganizationStatus, OrgStatusAction } from '../types';

/** Subscription management is generalized to these two org types too — see `FarmSubscriptionRenewalRepository`. */
const SUBSCRIPTION_CAPABLE_TYPES = new Set(['VETERINARY_OFFICE', 'CLINIC']);
/** Types with a directory profile (contact/address/social) — mirrors `PROFILE_FIELDS_ORG_TYPES`. */
const PROFILE_TYPES = new Set(['VETERINARY_OFFICE', 'CLINIC', 'VETERINARY_STORE']);

function statusTone(s: OrganizationStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'ACTIVE') return 'success';
  if (s === 'PENDING') return 'info';
  if (s === 'SUSPENDED') return 'warning';
  return 'danger';
}

type Pending = 'approve' | 'reject' | 'delete' | OrgStatusAction | null;

export default function AdminOrganizationDetailScreen() {
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const { t } = useTranslation('admin');
  const { t: tOrg } = useTranslation('organizations');
  const theme = useTheme();
  const toast = useToast();

  const q = useAdminOrganization(organizationId);
  const membersQ = useAdminOrganizationMembers(organizationId);
  const decide = useOrgDecisionMutation(organizationId);
  const setSubscription = useSetFarmSubscriptionMutation(organizationId);
  const [pending, setPending] = useState<Pending>(null);
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [renewalDecision, setRenewalDecision] = useState<'approve' | 'reject' | null>(null);
  const org = q.data;
  const isSubscriptionCapable = org ? SUBSCRIPTION_CAPABLE_TYPES.has(org.type) : false;
  const renewalsQ = useAdminFarmRenewals(organizationId, { enabled: isSubscriptionCapable });

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
  const runDelete = () =>
    decide.mutate(
      { decision: 'delete' },
      {
        onSuccess: () => {
          done(t('orgs.toast.deleted'));
          router.back();
        },
        onError: fail,
      },
    );
  const runStatus = (action: OrgStatusAction, reason?: string) =>
    decide.mutate(
      { decision: action, reason },
      { onSuccess: () => done(t('orgs.toast.statusChanged')), onError: fail },
    );

  const notProvided = t('orgs.detail.notProvided');
  const d = org?.details;
  const ownerName = org?.owner
    ? fullName(org.owner.firstName, org.owner.lastName) || org.owner.email
    : null;
  const pendingRenewal = org?.pendingRenewalRequest ?? null;
  const decidedRenewals = renewalsQ.requests.filter((r) => r.status !== 'PENDING');

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
              {d?.logoUrl ? (
                <ImageThumbnailRow
                  images={[d.logoUrl]}
                  onPress={() => setViewer({ images: [d.logoUrl as string], index: 0 })}
                />
              ) : null}
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
                      onPress={(index) =>
                        setViewer({ images: org.details.galleryUrls ?? [], index })
                      }
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

          {org.owner ? (
            <Section spacing="lg">
              <Label>{t('orgs.detail.ownerSection')}</Label>
              <Card variant="outlined" padding="md">
                <View style={{ rowGap: theme.spacing.sm }}>
                  <Row label={t('orgs.detail.ownerName')} value={ownerName ?? notProvided} />
                  <Row label={t('orgs.detail.ownerEmail')} value={org.owner.email} />
                  <Row label={t('orgs.detail.ownerPhone')} value={org.owner.phone ?? notProvided} />
                  {org.owner.country || org.owner.governorate ? (
                    <Row
                      label={t('orgs.detail.ownerRegion')}
                      value={[org.owner.governorate, org.owner.country].filter(Boolean).join('، ')}
                    />
                  ) : null}
                </View>
              </Card>
            </Section>
          ) : null}

          {d && PROFILE_TYPES.has(org.type) ? (
            <Section spacing="lg">
              <Label>{t('orgs.detail.contactSection')}</Label>
              <Card variant="outlined" padding="md">
                <View style={{ rowGap: theme.spacing.sm }}>
                  <Row label={t('orgs.detail.phone')} value={d.phone ?? notProvided} />
                  <Row label={t('orgs.detail.email')} value={d.email ?? notProvided} />
                  {d.whatsapp ? <Row label={t('orgs.detail.whatsapp')} value={d.whatsapp} /> : null}
                  {d.websiteUrl ? (
                    <Row label={t('orgs.detail.website')} value={d.websiteUrl} />
                  ) : null}
                  {d.instagramUrl ? (
                    <Row label={t('orgs.detail.instagram')} value={d.instagramUrl} />
                  ) : null}
                  {d.facebookUrl ? (
                    <Row label={t('orgs.detail.facebook')} value={d.facebookUrl} />
                  ) : null}
                  {d.tiktokUrl ? <Row label={t('orgs.detail.tiktok')} value={d.tiktokUrl} /> : null}
                  <Row label={t('orgs.detail.address')} value={d.address ?? notProvided} />
                  {d.country ? <Row label={t('orgs.detail.country')} value={d.country} /> : null}
                  {d.latitude != null && d.longitude != null ? (
                    <Row
                      label={t('orgs.detail.coordinates')}
                      value={`${d.latitude.toFixed(5)}, ${d.longitude.toFixed(5)}`}
                    />
                  ) : null}
                  {d.workingHours ? (
                    <Row label={t('orgs.detail.workingHours')} value={d.workingHours} />
                  ) : null}
                  {d.services && d.services.length > 0 ? (
                    <Row label={t('orgs.detail.services')} value={d.services.join('، ')} />
                  ) : null}
                </View>
              </Card>
            </Section>
          ) : null}

          <Section spacing="lg">
            <Label>{t('orgs.detail.registrationSection')}</Label>
            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.sm }}>
                {SUBSCRIPTION_CAPABLE_TYPES.has(org.type) ? (
                  <Row
                    label={t('orgs.detail.licenseNumber')}
                    value={d?.licenseNumber ?? notProvided}
                  />
                ) : null}
                <Row label={t('orgs.detail.createdLabel')} value={formatDate(org.createdAt)} />
                {org.decidedAt ? (
                  <Row label={t('orgs.detail.decidedAtLabel')} value={formatDate(org.decidedAt)} />
                ) : null}
                {org.decisionReason ? (
                  <Row label={t('orgs.detail.decisionLabel')} value={org.decisionReason} />
                ) : null}
              </View>
            </Card>
          </Section>

          {termsKeyForOrganization(org.type) ? (
            <Section spacing="lg">
              <Label>{tOrg('terms.adminTitle')}</Label>
              <Card variant="outlined" padding="md">
                {(org.termsAcceptances ?? []).length === 0 ? (
                  <Caption>{tOrg('terms.adminNone')}</Caption>
                ) : (
                  (org.termsAcceptances ?? []).map((a) => (
                    <AcceptedTermsLine key={a.termsKey} acceptance={a} />
                  ))
                )}
              </Card>
            </Section>
          ) : null}

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

              <Label>{t('orgs.detail.renewalSection')}</Label>
              {pendingRenewal ? (
                <Card variant="outlined" padding="md">
                  <View style={{ rowGap: theme.spacing.sm }}>
                    <Row
                      label={t('orgs.detail.renewalRequestedAt')}
                      value={formatDate(pendingRenewal.createdAt)}
                    />
                    <Row
                      label={t('orgs.detail.renewalPreviousEnd')}
                      value={
                        pendingRenewal.previousSubscriptionEndDate
                          ? formatDate(pendingRenewal.previousSubscriptionEndDate)
                          : t('farms.detail.notSet')
                      }
                    />
                    {pendingRenewal.note ? (
                      <Row label={t('farms.detail.renewalNote')} value={pendingRenewal.note} />
                    ) : null}
                    <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Button
                          label={t('farms.detail.approveRenewal')}
                          size="sm"
                          fullWidth
                          onPress={() => setRenewalDecision('approve')}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          label={t('farms.detail.rejectRenewal')}
                          variant="danger"
                          size="sm"
                          fullWidth
                          onPress={() => setRenewalDecision('reject')}
                        />
                      </View>
                    </View>
                  </View>
                </Card>
              ) : (
                <Caption>{t('orgs.detail.noPendingRenewal')}</Caption>
              )}
              {decidedRenewals.length > 0 ? (
                <>
                  <Caption>{t('orgs.detail.renewalHistory')}</Caption>
                  {decidedRenewals.map((r) => (
                    <Card key={r.id} variant="outlined" padding="sm">
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Caption>{formatDate(r.createdAt)}</Caption>
                        <Badge
                          label={t(`orgs.detail.renewalStatus.${r.status}`)}
                          tone={r.status === 'APPROVED' ? 'success' : 'danger'}
                          size="sm"
                        />
                      </View>
                      {r.decisionReason ? <Caption>{r.decisionReason}</Caption> : null}
                    </Card>
                  ))}
                </>
              ) : null}
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
                      <Badge
                        label={tOrg(`role.${m.roleKey}`, { defaultValue: m.roleKey })}
                        tone="neutral"
                        size="sm"
                      />
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
              {/* Admin edit of the organization's profile (name, contact, license…). */}
              {org.type !== 'SYNDICATE' && org.type !== 'CHAT_ROOM' ? (
                <Button
                  label={t('orgs.edit')}
                  variant="outline"
                  leftIcon="create-outline"
                  fullWidth
                  onPress={() => router.push(Routes.organizationEdit(org.id))}
                />
              ) : null}
              {org.status !== 'DEACTIVATED' ? (
                <Button
                  label={t('orgs.delete')}
                  variant="danger"
                  leftIcon="trash-outline"
                  fullWidth
                  onPress={() => setPending('delete')}
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

      <ConfirmationDialog
        visible={pending === 'delete'}
        title={t('orgs.deleteTitle')}
        message={t('orgs.deleteBody')}
        confirmLabel={t('orgs.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={decide.isPending}
        onConfirm={runDelete}
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

      <RenewalApproveDialog
        visible={renewalDecision === 'approve'}
        organizationId={organizationId}
        requestId={pendingRenewal?.id ?? null}
        onDone={() => {
          toast.show({ message: t('farms.toast.renewalApproved'), tone: 'success' });
          setRenewalDecision(null);
          void q.refetch();
        }}
        onError={fail}
        onCancel={() => setRenewalDecision(null)}
      />
      <RenewalRejectDialog
        visible={renewalDecision === 'reject'}
        organizationId={organizationId}
        requestId={pendingRenewal?.id ?? null}
        onDone={() => {
          toast.show({ message: t('farms.toast.renewalRejected'), tone: 'success' });
          setRenewalDecision(null);
          void q.refetch();
        }}
        onError={fail}
        onCancel={() => setRenewalDecision(null)}
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

/** "The applicant accepted <terms title> on <date>" — the title from the served terms. */
function AcceptedTermsLine({ acceptance }: { acceptance: AdminTermsAcceptance }) {
  const { t } = useTranslation('organizations');
  const terms = useOrganizationTerms(acceptance.termsKey);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: 6 }}>
      <Icon name="checkmark-circle" size="iconSm" color="success" />
      <Caption style={{ flex: 1 }}>
        {t('terms.adminAccepted', {
          title: terms.data?.title ?? acceptance.termsKey,
          date: formatDateTime(acceptance.acceptedAt),
        })}
        {acceptance.isCurrentVersion ? '' : ` ${t('terms.adminOutdated')}`}
      </Caption>
    </View>
  );
}
