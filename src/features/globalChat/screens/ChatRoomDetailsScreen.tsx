import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, IconButton, TextButton } from '@/components/actions';
import { Icon } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Switch } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useOrganization } from '@/features/organizations/hooks';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { useChatRoom, useJoinChatRoom, useLeaveChatRoom, useSetChatRoomMuted } from '../hooks';

/** Route `/(app)/global-chat/[organizationId]` — "معلومات الغرفة". */
export default function ChatRoomDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('globalChat');
  const toast = useToast();
  const caps = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const q = useChatRoom(orgId);
  const org = useOrganization(orgId, { enabled: Boolean(q.data) });
  const join = useJoinChatRoom(orgId);
  const leave = useLeaveChatRoom(orgId);
  const mute = useSetChatRoomMuted(orgId);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const notFound = q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('details.title')} showBack />
        <EmptyState
          icon="lock-closed-outline"
          title={t('details.notFoundTitle')}
          message={t('details.notFoundBody')}
          actionLabel={t('details.back')}
          onAction={() => router.replace(Routes.globalChat)}
        />
      </SafeAreaScreen>
    );
  }
  if (q.isLoading || !q.data) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('details.title')} showBack />
        <Loading fill />
      </SafeAreaScreen>
    );
  }
  if (q.isError) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('details.title')} showBack />
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      </SafeAreaScreen>
    );
  }

  const room = q.data;
  const myRole = org.data?.myRole;
  const isOwner = myRole === 'OWNER';
  const canModerate = caps.isAdmin || isOwner || myRole === 'SUPERVISOR';

  const openThread = (): void => router.push(Routes.globalChatRoomThread(room.id));

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('details.title')}
        showBack
        right={
          canModerate ? (
            <IconButton
              icon="create-outline"
              variant="soft"
              accessibilityLabel={t('details.editA11y')}
              onPress={() => router.push(Routes.organizationEdit(room.id))}
            />
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={{
          padding: theme.screenPadding,
          rowGap: theme.spacing.lg,
          paddingBottom: theme.spacing.huge,
        }}
      >
        <View style={{ alignItems: 'center', rowGap: theme.spacing.sm }}>
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: theme.radius.xl,
              backgroundColor: theme.colors.surfaceAccent,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {room.logoUrl ? (
              <Image
                source={room.logoUrl}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <Icon name="chatbubbles-outline" size="iconXl" color="primary" />
            )}
          </View>
          <Heading level={2}>{room.name}</Heading>
          {room.description ? <Text color="textSecondary">{room.description}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
            <Icon name="people-outline" size="iconSm" color="textMuted" />
            <Caption>{t('room.memberCount', { count: room.memberCount })}</Caption>
          </View>
        </View>

        {room.rules || canModerate ? (
          <View
            style={{
              padding: theme.spacing.md,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.successSoft,
              rowGap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label>{t('details.rulesTitle')}</Label>
              {canModerate ? (
                <IconButton
                  icon="create-outline"
                  variant="plain"
                  size="sm"
                  accessibilityLabel={t('details.editRulesA11y')}
                  onPress={() => router.push(Routes.globalChatRoomEditRules(room.id))}
                />
              ) : null}
            </View>
            {room.rules ? <Text>{room.rules}</Text> : <Caption>{t('details.rulesEmpty')}</Caption>}
          </View>
        ) : null}

        {room.isJoined ? (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: theme.spacing.md,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text>{t('details.muteLabel')}</Text>
              <Switch
                value={room.notificationsMuted}
                onValueChange={(value) =>
                  mute.mutate(value, {
                    onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                  })
                }
                disabled={mute.isPending}
              />
            </View>

            {room.joinedAt ? (
              <Caption>{t('details.joinedAt', { date: formatDate(room.joinedAt) })}</Caption>
            ) : null}

            {isOwner || caps.isAdmin ? (
              <TextButton
                label={t('details.manageMembers')}
                icon="people-outline"
                onPress={() => router.push(Routes.organizationMembers(room.id))}
              />
            ) : null}

            {canModerate ? (
              <TextButton
                label={t('details.manageModerators')}
                icon="shield-outline"
                onPress={() => router.push(Routes.organizationSupervisors(room.id))}
              />
            ) : null}

            <TextButton
              label={t('details.report')}
              icon="flag-outline"
              tone="danger"
              onPress={() =>
                router.push({
                  pathname: Routes.globalChatReport,
                  params: { targetType: 'ROOM', targetId: room.id },
                })
              }
            />

            <Button label={t('details.openChat')} fullWidth onPress={openThread} />

            {!isOwner ? (
              <TextButton
                label={t('details.leave')}
                icon="exit-outline"
                tone="danger"
                disabled={leave.isPending}
                onPress={() => setConfirmLeave(true)}
              />
            ) : null}
          </>
        ) : (
          <Button
            label={join.isPending ? t('details.joining') : t('details.join')}
            fullWidth
            loading={join.isPending}
            disabled={join.isPending}
            onPress={() =>
              join.mutate(undefined, {
                onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
              })
            }
          />
        )}
      </ScrollView>

      <ConfirmationDialog
        visible={confirmLeave}
        title={t('details.leaveConfirmTitle')}
        message={t('details.leaveConfirmBody')}
        confirmLabel={t('details.leave')}
        cancelLabel={t('common.cancel', { defaultValue: 'إلغاء' })}
        destructive
        loading={leave.isPending}
        onConfirm={() => {
          setConfirmLeave(false);
          leave.mutate(undefined, {
            onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
          });
        }}
        onCancel={() => setConfirmLeave(false)}
      />
    </SafeAreaScreen>
  );
}
