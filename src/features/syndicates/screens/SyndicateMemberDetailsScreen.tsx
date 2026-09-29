import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Avatar, Badge, Card, Icon, type IconName } from '@/components/content';
import { ConfirmationDialog, EmptyState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  useMySyndicateAccess,
  useOpenSyndicateMemberConversation,
  useRemoveSyndicateMember,
  useSyndicateMember,
} from '../hooks';

function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
      <Icon name={icon} size="iconSm" color="primary" />
      <View style={{ flex: 1 }}>
        <Caption color="textMuted">{label}</Caption>
        <Text variant="body">{value}</Text>
      </View>
    </View>
  );
}

/**
 * Route `/(app)/syndicates/[organizationId]/members/[userId]` — one registered
 * member's BASIC details for a syndicate admin (no profile editing). "إرسال
 * رسالة" opens the existing chat (SYNDICATE_MEMBER conversation).
 */
export default function SyndicateMemberDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const { organizationId, userId } = useLocalSearchParams<{
    organizationId: string;
    userId: string;
  }>();
  const orgId = organizationId ?? '';
  const q = useSyndicateMember(organizationId, userId);
  const access = useMySyndicateAccess(organizationId);
  const openChat = useOpenSyndicateMemberConversation(orgId);
  const remove = useRemoveSyndicateMember(orgId);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (q.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('members.detailsTitle')} showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }
  const member = q.data;
  if (q.isError || !member) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('members.detailsTitle')} showBack />
        <EmptyState icon="person-outline" title={t('members.notFound')} />
      </SafeAreaScreen>
    );
  }

  const name = `${member.firstName} ${member.lastName}`;
  const location = [member.governorate, member.country].filter(Boolean).join('، ');

  const onMessage = (): void => {
    openChat.mutate(member.userId, {
      onSuccess: (conversation) => router.push(Routes.chatThread(conversation.id)),
      onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    });
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('members.detailsTitle')} showBack />
      <ScrollView
        contentContainerStyle={{
          padding: theme.screenPadding,
          rowGap: theme.spacing.lg,
          paddingBottom: theme.spacing.huge,
        }}
      >
        <Card
          variant="elevated"
          padding="lg"
          style={{ alignItems: 'center', rowGap: theme.spacing.sm }}
        >
          <Avatar uri={member.avatarUrl} name={name} size="avatarXl" />
          <Text variant="title" style={{ textAlign: 'center' }}>
            {name}
          </Text>
          {member.isVeterinarian ? <Badge label={t('members.vet')} tone="success" /> : null}
        </Card>

        <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.md }}>
          <InfoRow icon="mail-outline" label={t('members.email')} value={member.email} />
          {member.phone ? (
            <InfoRow icon="call-outline" label={t('members.phone')} value={member.phone} />
          ) : null}
          {location ? (
            <InfoRow icon="location-outline" label={t('members.location')} value={location} />
          ) : null}
          {member.specialization ? (
            <InfoRow
              icon="school-outline"
              label={t('members.specialization')}
              value={member.specialization}
            />
          ) : null}
          <InfoRow
            icon="calendar-outline"
            label={t('members.registeredAt')}
            value={formatDate(member.registeredAt)}
          />
        </Card>
        <Caption color="textMuted">{t('members.readOnlyNote')}</Caption>

        {access.data?.canMessageMembers ? (
          <Button
            label={t('members.sendMessage')}
            leftIcon="chatbubble-ellipses-outline"
            fullWidth
            loading={openChat.isPending}
            disabled={openChat.isPending}
            onPress={onMessage}
          />
        ) : null}
        {access.data?.canManageMembers ? (
          <Button
            label={t('members.remove')}
            variant="outline"
            leftIcon="person-remove-outline"
            fullWidth
            disabled={remove.isPending}
            onPress={() => setConfirmRemove(true)}
          />
        ) : null}
      </ScrollView>

      <ConfirmationDialog
        visible={confirmRemove}
        title={t('members.removeConfirmTitle')}
        message={t('members.removeConfirmBody')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() =>
          remove.mutate(member.userId, {
            onSuccess: () => {
              setConfirmRemove(false);
              toast.show({ message: t('members.removed'), tone: 'success' });
              router.back();
            },
            onError: (e) => {
              setConfirmRemove(false);
              toast.show({ message: apiErrorMessage(e), tone: 'danger' });
            },
          })
        }
      />
    </SafeAreaScreen>
  );
}
