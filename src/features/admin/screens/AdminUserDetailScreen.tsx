import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Chip } from '@/components/content';
import { ConfirmationDialog, ErrorState, Loading, useToast } from '@/components/feedback';
import { PasswordInput } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Modal } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { countryDisplayName } from '@/features/registration';
import { useAuth } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { ReasonPromptDialog } from '../components';
import {
  useAdminUser,
  useMessageUserMutation,
  useUserPasswordMutations,
  useUserRoleMutation,
  useUserStatusMutation,
} from '../hooks';
import { ROLE_KEYS, type RoleKey, type UserStatus, type UserStatusAction } from '../types';

function statusTone(status: UserStatus): 'success' | 'info' | 'warning' | 'danger' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PENDING_VERIFICATION') return 'info';
  if (status === 'SUSPENDED') return 'warning';
  return 'danger';
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: 12 }}>
      <Caption>{label}</Caption>
      <Text variant="caption" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

export default function AdminUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { t, i18n } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();
  const { session } = useAuth();

  const q = useAdminUser(userId);
  const statusMut = useUserStatusMutation(userId);
  const roleMut = useUserRoleMutation(userId);

  const messageMut = useMessageUserMutation(userId);
  const { setPassword, sendReset } = useUserPasswordMutations(userId);
  const [messaging, setMessaging] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [pendingAction, setPendingAction] = useState<UserStatusAction | null>(null);
  const [avatarViewer, setAvatarViewer] = useState(false);
  const [docViewer, setDocViewer] = useState<{ images: string[]; index: number } | null>(null);
  const isSelf = session?.user.id === userId;

  const runStatus = (reason?: string) => {
    if (!pendingAction) return;
    const action = pendingAction;
    statusMut.mutate(
      { action, reason },
      {
        onSuccess: () => {
          toast.show({
            message: t(
              `users.toast.${action === 'suspend' ? 'suspended' : action === 'activate' ? 'activated' : 'deactivated'}`,
            ),
            tone: 'success',
          });
          setPendingAction(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const toggleRole = (roleKey: RoleKey, has: boolean) => {
    roleMut.mutate(
      { roleKey, op: has ? 'remove' : 'add' },
      {
        onSuccess: () =>
          toast.show({
            message: t(has ? 'users.toast.roleRemoved' : 'users.toast.roleAdded'),
            tone: 'success',
          }),
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const onSendMessage = (body: string) => {
    messageMut.mutate(body, {
      onSuccess: (thread) => {
        setMessaging(false);
        toast.show({ message: t('users.toast.messageSent'), tone: 'success' });
        // Continue the conversation in the existing support-messages thread.
        router.push(Routes.supportThread('support-messages', thread.id));
      },
      onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    });
  };

  const onSetPassword = (newPassword: string) => {
    setPassword.mutate(newPassword, {
      onSuccess: () => {
        setSettingPassword(false);
        toast.show({ message: t('users.toast.passwordSet'), tone: 'success' });
      },
      onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    });
  };

  const onSendReset = () => {
    sendReset.mutate(undefined, {
      onSuccess: () => {
        setConfirmReset(false);
        toast.show({ message: t('users.toast.resetSent'), tone: 'success' });
      },
      onError: (e) => {
        setConfirmReset(false);
        toast.show({ message: apiErrorMessage(e), tone: 'danger' });
      },
    });
  };

  const u = q.data;
  const dash = (v: string | null | undefined) => (v && v.trim() ? v : '—');

  return (
    <ScrollScreen>
      <AppHeader
        title={t('users.detail.title')}
        showBack
        right={
          u ? (
            <Button
              label={t('users.detail.editCta')}
              size="sm"
              variant="ghost"
              onPress={() => router.push(Routes.adminUserEdit(userId))}
            />
          ) : undefined
        }
      />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !q.data ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: theme.spacing.md,
              }}
            >
              <ImageThumbnailRow
                images={q.data.avatarUrl ? [q.data.avatarUrl] : []}
                size={64}
                fallbackIcon="person-outline"
                onPress={() => (q.data?.avatarUrl ? setAvatarViewer(true) : undefined)}
              />
              <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
                <Text variant="heading">
                  {`${q.data.firstName} ${q.data.lastName}`.trim() || q.data.email}
                </Text>
                <Caption>{q.data.email}</Caption>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: 4 }}>
                  <Badge
                    label={t(`users.status.${q.data.status}`)}
                    tone={statusTone(q.data.status)}
                    size="sm"
                  />
                  <Badge
                    label={t(`users.vetStatus.${q.data.veterinarianStatus}`)}
                    tone="neutral"
                    size="sm"
                  />
                </View>
              </View>
            </View>
          </Section>

          <Section spacing="lg">
            <Label>{t('users.detail.profileSection')}</Label>
            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.sm }}>
                <InfoRow label={t('users.detail.emailLabel')} value={q.data.email} />
                <InfoRow label={t('users.detail.phoneLabel')} value={dash(q.data.phone)} />
                <InfoRow
                  label={t('users.detail.countryLabel')}
                  value={dash(countryDisplayName(q.data.country, i18n.language))}
                />
                <InfoRow
                  label={t('users.detail.governorateLabel')}
                  value={dash(q.data.governorate)}
                />
                <InfoRow
                  label={t('users.detail.genderLabel')}
                  value={q.data.gender ? t(`users.detail.gender.${q.data.gender}`) : '—'}
                />
                {q.data.specialization ? (
                  <InfoRow
                    label={t('users.detail.specializationLabel')}
                    value={q.data.specialization}
                  />
                ) : null}
              </View>
            </Card>
          </Section>

          <Section spacing="lg">
            <Label>{t('users.detail.accountSection')}</Label>
            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.sm }}>
                <InfoRow
                  label={t('users.detail.statusLabel')}
                  value={t(`users.status.${q.data.status}`)}
                />
                {q.data.registrationType ? (
                  <InfoRow
                    label={t('users.detail.registrationLabel')}
                    value={t(`users.detail.registrationType.${q.data.registrationType}`)}
                  />
                ) : null}
                <InfoRow
                  label={t('users.detail.vetLabel')}
                  value={t(`users.vetStatus.${q.data.veterinarianStatus}`)}
                />
                <InfoRow
                  label={t('users.detail.joinedLabel')}
                  value={formatDate(q.data.createdAt)}
                />
              </View>
            </Card>
          </Section>

          {q.data.veterinarianApplication ? (
            <Section spacing="lg">
              <Label>{t('users.detail.vetApplicationSection')}</Label>
              <Card variant="outlined" padding="md">
                <View style={{ rowGap: theme.spacing.sm }}>
                  <InfoRow
                    label={t('users.detail.vetLabel')}
                    value={t(`users.vetStatus.${q.data.veterinarianStatus}`)}
                  />
                  <InfoRow
                    label={t('users.detail.vetSubTypeLabel')}
                    value={q.data.veterinarianApplication.subType}
                  />
                  <InfoRow
                    label={t('users.detail.vetAppliedAtLabel')}
                    value={formatDate(q.data.veterinarianApplication.createdAt)}
                  />
                  {q.data.veterinarianApplication.decisionReason ? (
                    <InfoRow
                      label={t('users.detail.vetDecisionReasonLabel')}
                      value={q.data.veterinarianApplication.decisionReason}
                    />
                  ) : null}
                  <InfoRow
                    label={t('users.detail.vetDocumentsLabel')}
                    value={String(q.data.veterinarianApplication.documents.length)}
                  />
                  {(() => {
                    // Identity / licence documents — private, signed URLs only
                    // (present only when this admin may review applications).
                    const docs = q.data.veterinarianApplication.documents.filter(
                      (d): d is typeof d & { downloadUrl: string } => Boolean(d.downloadUrl),
                    );
                    const images = docs.filter((d) => d.mimeType.startsWith('image/'));
                    const files = docs.filter((d) => !d.mimeType.startsWith('image/'));
                    if (docs.length === 0) return null;
                    return (
                      <View style={{ rowGap: theme.spacing.xs }}>
                        {images.length > 0 ? (
                          <ImageThumbnailRow
                            images={images.map((d) => d.downloadUrl)}
                            size={72}
                            onPress={(index) =>
                              setDocViewer({ images: images.map((d) => d.downloadUrl), index })
                            }
                          />
                        ) : null}
                        {files.map((d) => (
                          <Button
                            key={d.downloadUrl}
                            label={`${t('users.detail.openDocument')} · ${d.filename}`}
                            variant="outline"
                            leftIcon="document-outline"
                            onPress={() => void Linking.openURL(d.downloadUrl)}
                          />
                        ))}
                      </View>
                    );
                  })()}
                </View>
              </Card>
            </Section>
          ) : null}

          <Section spacing="lg">
            <Label>{t('users.detail.organizationsSection')}</Label>
            <Card variant="outlined" padding="md">
              {(q.data.organizations ?? []).length === 0 ? (
                <Caption>{t('users.detail.noOrganizations')}</Caption>
              ) : (
                <View style={{ rowGap: theme.spacing.sm }}>
                  {(q.data.organizations ?? []).map((o) => (
                    <Text
                      key={o.id}
                      variant="caption"
                      color="primary"
                      onPress={() => router.push(Routes.adminOrganization(o.id))}
                    >
                      {`${o.name} · ${o.type} · ${o.role}`}
                    </Text>
                  ))}
                </View>
              )}
            </Card>
          </Section>

          <Section spacing="lg">
            <Label>{t('users.detail.actionsSection')}</Label>
            <View style={{ rowGap: theme.spacing.sm }}>
              <Button
                label={t('users.detail.editCta')}
                variant="outline"
                fullWidth
                onPress={() => router.push(Routes.adminUserEdit(userId))}
              />
              {!isSelf ? (
                <Button
                  label={t('users.detail.messageCta')}
                  variant="outline"
                  fullWidth
                  onPress={() => setMessaging(true)}
                />
              ) : null}
            </View>
          </Section>

          {!isSelf ? (
            <Section spacing="lg">
              <Label>{t('users.detail.passwordSection')}</Label>
              <Caption style={{ marginBottom: theme.spacing.sm }}>
                {t('users.detail.passwordHint')}
              </Caption>
              <View style={{ rowGap: theme.spacing.sm }}>
                <Button
                  label={t('users.detail.setPasswordCta')}
                  variant="outline"
                  fullWidth
                  onPress={() => setSettingPassword(true)}
                />
                <Button
                  label={t('users.detail.sendResetCta')}
                  variant="ghost"
                  fullWidth
                  disabled={q.data.status !== 'ACTIVE'}
                  onPress={() => setConfirmReset(true)}
                />
              </View>
            </Section>
          ) : null}

          <Section spacing="lg">
            <Label>{t('users.detail.rolesSection')}</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {ROLE_KEYS.map((rk) => {
                const has = q.data!.roles.includes(rk);
                return (
                  <Chip
                    key={rk}
                    label={rk}
                    selected={has}
                    disabled={roleMut.isPending || (isSelf && rk === 'ADMIN')}
                    onPress={() => toggleRole(rk, has)}
                  />
                );
              })}
            </View>
          </Section>

          <Section spacing="lg">
            {isSelf ? (
              <Caption>{t('users.detail.selfActionBlocked')}</Caption>
            ) : (
              <View style={{ rowGap: theme.spacing.sm }}>
                {q.data.status !== 'ACTIVE' ? (
                  <Button
                    label={t('users.detail.activate')}
                    variant="primary"
                    fullWidth
                    onPress={() => setPendingAction('activate')}
                  />
                ) : null}
                {q.data.status === 'ACTIVE' ? (
                  <Button
                    label={t('users.detail.suspend')}
                    variant="outline"
                    fullWidth
                    onPress={() => setPendingAction('suspend')}
                  />
                ) : null}
                {q.data.status !== 'DEACTIVATED' ? (
                  <Button
                    label={t('users.detail.deactivate')}
                    variant="danger"
                    fullWidth
                    onPress={() => setPendingAction('deactivate')}
                  />
                ) : null}
              </View>
            )}
          </Section>
        </>
      )}

      <ConfirmationDialog
        visible={pendingAction === 'activate'}
        title={t('users.detail.activateTitle')}
        message={t('users.detail.activateBody')}
        confirmLabel={t('users.detail.activate')}
        cancelLabel={t('common.cancel')}
        loading={statusMut.isPending}
        onConfirm={() => runStatus()}
        onCancel={() => setPendingAction(null)}
      />

      <ReasonPromptDialog
        visible={pendingAction === 'suspend' || pendingAction === 'deactivate'}
        title={t(
          pendingAction === 'suspend'
            ? 'users.detail.suspendTitle'
            : 'users.detail.deactivateTitle',
        )}
        message={t(
          pendingAction === 'suspend' ? 'users.detail.suspendBody' : 'users.detail.deactivateBody',
        )}
        label={t('users.detail.reasonLabel')}
        placeholder={t('users.detail.reasonPlaceholder')}
        confirmLabel={t(
          pendingAction === 'suspend' ? 'users.detail.suspend' : 'users.detail.deactivate',
        )}
        cancelLabel={t('common.cancel')}
        destructive
        loading={statusMut.isPending}
        onConfirm={(reason) => runStatus(reason || undefined)}
        onCancel={() => setPendingAction(null)}
      />

      <ReasonPromptDialog
        visible={messaging}
        title={t('users.detail.messageTitle')}
        message={t('users.detail.messageBody')}
        label={t('users.detail.messageLabel')}
        placeholder={t('users.detail.messagePlaceholder')}
        confirmLabel={t('users.detail.messageSend')}
        cancelLabel={t('common.cancel')}
        required
        loading={messageMut.isPending}
        onConfirm={onSendMessage}
        onCancel={() => setMessaging(false)}
      />

      <SetPasswordDialog
        visible={settingPassword}
        loading={setPassword.isPending}
        onConfirm={onSetPassword}
        onCancel={() => setSettingPassword(false)}
      />

      <ConfirmationDialog
        visible={confirmReset}
        title={t('users.detail.sendResetTitle')}
        message={t('users.detail.sendResetBody')}
        confirmLabel={t('users.detail.sendResetCta')}
        cancelLabel={t('common.cancel')}
        loading={sendReset.isPending}
        onConfirm={onSendReset}
        onCancel={() => setConfirmReset(false)}
      />

      <ImageViewer
        visible={docViewer !== null}
        images={docViewer?.images ?? []}
        initialIndex={docViewer?.index ?? 0}
        onClose={() => setDocViewer(null)}
      />

      <ImageViewer
        visible={avatarViewer}
        images={q.data?.avatarUrl ? [q.data.avatarUrl] : []}
        onClose={() => setAvatarViewer(false)}
      />
    </ScrollScreen>
  );
}

/** Collects an admin-chosen new password. The value lives only in this dialog's state. */
function SetPasswordDialog({
  visible,
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  loading: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const [value, setValue] = useState('');
  const tooShort = value.length > 0 && value.length < 10;

  return (
    <Modal
      visible={visible}
      onClose={() => {
        setValue('');
        onCancel();
      }}
      title={t('users.detail.setPasswordTitle')}
      dismissable={!loading}
    >
      <View style={{ rowGap: theme.spacing.md }}>
        <Caption>{t('users.detail.setPasswordBody')}</Caption>
        <PasswordInput
          label={t('users.detail.newPasswordLabel')}
          value={value}
          onChangeText={setValue}
          error={tooShort ? t('users.detail.passwordTooShort') : undefined}
          autoFocus
        />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.cancel')}
              variant="ghost"
              fullWidth
              disabled={loading}
              onPress={() => {
                setValue('');
                onCancel();
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('users.detail.setPasswordCta')}
              variant="danger"
              fullWidth
              loading={loading}
              disabled={loading || value.length < 10}
              onPress={() => {
                const v = value;
                setValue('');
                onConfirm(v);
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
