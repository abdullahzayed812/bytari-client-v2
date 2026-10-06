import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Avatar, Badge, Card } from '@/components/content';
import { ConfirmationDialog, Loading, useToast } from '@/components/feedback';
import { Section } from '@/components/layout';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  useOpenInteractionConversation,
  usePublicationInteractions,
  useSetPublicationResolution,
} from '../hooks';
import {
  RESOLUTIONS_BY_KIND,
  type AnimalPublication,
  type OwnerPublicationInteraction,
  type PublicationResolution,
} from '../types';

/**
 * Owner-only part of a listing's detail: its OUTCOME (available → the kind's
 * completion: ADOPTED / MATED / FOUND, or reopen) and the requests / sighting reports received,
 * each with a button into the in-app conversation with that person. Every
 * action is re-authorized server-side (owner only).
 */
export function PublicationOwnerPanel({ publication }: { publication: AnimalPublication }) {
  const theme = useTheme();
  const { t } = useTranslation('publications');
  const toast = useToast();
  const resolve = useSetPublicationResolution(publication.id);
  const requests = usePublicationInteractions(publication.id, {
    enabled: publication.status === 'APPROVED',
  });
  const openChat = useOpenInteractionConversation(publication.id);
  const [pending, setPending] = useState<PublicationResolution | 'REOPEN' | null>(null);

  const current = publication.resolution ?? null;
  const approved = publication.status === 'APPROVED';

  const apply = (next: PublicationResolution | null) =>
    resolve.mutate(next, {
      onSuccess: () => {
        setPending(null);
        toast.show({ tone: 'success', message: t('resolution.updated') });
      },
      onError: (error) => {
        setPending(null);
        toast.show({ tone: 'danger', message: apiErrorMessage(error) });
      },
    });

  const chatWith = (i: OwnerPublicationInteraction) => {
    if (i.conversationId) {
      router.push(Routes.chatThread(i.conversationId));
      return;
    }
    openChat.mutate(i.id, {
      onSuccess: ({ conversationId }) => router.push(Routes.chatThread(conversationId)),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  return (
    <>
      <Section spacing="xl">
        <Label>{t('resolution.sectionTitle')}</Label>
        <Card variant="outlined" padding="md">
          <View style={{ rowGap: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodyMedium">{t('resolution.sectionTitle')}</Text>
              <Badge
                label={t(`resolution.status.${current ?? 'AVAILABLE'}`)}
                tone={current === null ? 'success' : current === 'CLOSED' ? 'neutral' : 'info'}
                size="sm"
              />
            </View>
            {!approved ? (
              <Caption>{t('resolution.onlyApproved')}</Caption>
            ) : current === null ? (
              <View style={{ rowGap: theme.spacing.xs }}>
                {/* Only the kind's completion action: تم التبني / تم التزاوج / تم العثور عليه. */}
                {RESOLUTIONS_BY_KIND[publication.kind]
                  .filter((r) => r !== 'CLOSED')
                  .map((r) => (
                    <Button
                      key={r}
                      label={t(`resolution.action.${r}`)}
                      variant="primary"
                      size="sm"
                      fullWidth
                      disabled={resolve.isPending}
                      onPress={() => setPending(r)}
                    />
                  ))}
              </View>
            ) : (
              <Button
                label={t('resolution.reopen')}
                variant="outline"
                size="sm"
                fullWidth
                loading={resolve.isPending}
                onPress={() => apply(null)}
              />
            )}
          </View>
        </Card>
      </Section>

      {approved ? (
        <Section spacing="xl">
          <Label>{t('requests.title')}</Label>
          {requests.isLoading ? (
            <Loading />
          ) : (requests.data ?? []).length === 0 ? (
            <Caption>{t('requests.empty')}</Caption>
          ) : (
            <View style={{ rowGap: theme.spacing.sm }}>
              {(requests.data ?? []).map((i) => {
                const name = `${i.requester.firstName} ${i.requester.lastName}`.trim();
                return (
                  <Card key={i.id} variant="outlined" padding="sm">
                    <View style={{ flexDirection: 'row', columnGap: 10, alignItems: 'center' }}>
                      <Avatar uri={i.requester.avatarUrl} name={name} size="avatarSm" />
                      <View style={{ flex: 1, rowGap: 2 }}>
                        <Text variant="bodyStrong">{name}</Text>
                        <Caption>
                          {`${t(`requests.type.${i.type}`)} · ${t('requests.sentAt', {
                            date: formatDate(i.createdAt),
                          })}`}
                        </Caption>
                        {i.message ? <Caption color="textMuted">{i.message}</Caption> : null}
                      </View>
                      <Button
                        label={t('requests.chat')}
                        size="sm"
                        variant="outline"
                        leftIcon="chatbubble-ellipses-outline"
                        disabled={openChat.isPending}
                        onPress={() => chatWith(i)}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </Section>
      ) : null}

      <ConfirmationDialog
        visible={pending !== null && pending !== 'REOPEN'}
        title={t('resolution.confirmTitle')}
        message={t('resolution.confirmBody')}
        confirmLabel={pending && pending !== 'REOPEN' ? t(`resolution.action.${pending}`) : ''}
        loading={resolve.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending && pending !== 'REOPEN') apply(pending);
        }}
      />
    </>
  );
}
