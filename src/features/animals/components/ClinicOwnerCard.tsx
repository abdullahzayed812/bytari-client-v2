import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Row } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useConversations, useSetClinicChatActive, useStartConversation } from '@/features/chat';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import type { ClinicAnimalProfile } from '../types';

/**
 * Legacy clinic pet page owner block: owner name + phone ("صاحب الحيوان"),
 * "محادثة المالك" and "إيقاف / تفعيل المحادثة". The conversation is the v2
 * one-per-(clinic, owner) PET_OWNER_CLINIC chat; it is created only when the
 * clinic first opens or pauses it — never just by viewing the page.
 */
export function ClinicOwnerCard({
  organizationId,
  owner,
}: {
  organizationId: string;
  owner: NonNullable<ClinicAnimalProfile['owner']>;
}) {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const toast = useToast();
  const conversations = useConversations({ organizationId });
  const start = useStartConversation();
  const toggle = useSetClinicChatActive();

  const existing = useMemo(
    () =>
      conversations.conversations.find(
        (c) => c.type === 'PET_OWNER_CLINIC' && c.counterpartUserId === owner.id,
      ),
    [conversations.conversations, owner.id],
  );
  const paused = existing?.status === 'CLOSED';
  const busy = start.isPending || toggle.isPending;
  const onError = (error: unknown) =>
    toast.show({ tone: 'danger', message: apiErrorMessage(error) });

  const ensureConversation = (then: (conversationId: string) => void) => {
    if (existing) return then(existing.id);
    start.mutate(
      { organizationId, targetUserId: owner.id },
      { onSuccess: (c) => then(c.id), onError },
    );
  };

  const name = `${owner.firstName} ${owner.lastName}`.trim();

  return (
    <Card variant="outlined" padding="md">
      <Row gap="md">
        <Icon name="person-circle-outline" size="iconLg" color="primary" />
        <View style={{ flex: 1, rowGap: 2 }}>
          <Caption>{t('detail.ownerName')}</Caption>
          <Text variant="bodyStrong">{name}</Text>
          {owner.phone ? (
            <Text
              color="primary"
              onPress={() => void Linking.openURL(`tel:${owner.phone}`)}
              accessibilityRole="link"
            >
              {owner.phone}
            </Text>
          ) : null}
        </View>
      </Row>
      <Row gap="sm" style={{ marginTop: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button
            label={t('detail.chatOwner')}
            size="sm"
            leftIcon="chatbubble-ellipses-outline"
            disabled={busy}
            onPress={() => ensureConversation((id) => router.push(Routes.chatThread(id)))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={paused ? t('detail.resumeChat') : t('detail.pauseChat')}
            size="sm"
            variant="outline"
            leftIcon={paused ? 'play-circle-outline' : 'pause-circle-outline'}
            disabled={busy}
            onPress={() =>
              ensureConversation((id) =>
                toggle.mutate(
                  { conversationId: id, active: paused },
                  {
                    onSuccess: (c) =>
                      toast.show({
                        tone: 'success',
                        message:
                          c.status === 'CLOSED' ? t('detail.chatPaused') : t('detail.chatResumed'),
                      }),
                    onError,
                  },
                ),
              )
            }
          />
        </View>
      </Row>
    </Card>
  );
}
