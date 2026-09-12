import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { useCloseConversation } from '@/features/chat';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { VetJobApplicationStatusBadge } from '../components';
import { useVetJobApplicationAction, useVetJobOfferApplications } from '../hooks';
import type { VetJobApplication } from '../types';

/** Route `/(app)/vet-jobs/offers/[offerId]/applicants` — "المتقدمون على الوظيفة". */
export default function VetJobApplicantsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const toast = useToast();
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  const q = useVetJobOfferApplications(offerId);
  const action = useVetJobApplicationAction();
  const [accepting, setAccepting] = useState<VetJobApplication | null>(null);
  const [rejecting, setRejecting] = useState<VetJobApplication | null>(null);

  const onAccept = (): void => {
    if (!accepting) return;
    action.mutate(
      { id: accepting.id, action: 'accept' },
      {
        onSuccess: (updated) => {
          toast.show({ message: t('applicants.toast.accepted'), tone: 'success' });
          setAccepting(null);
          if (updated.conversationId) router.push(Routes.chatThread(updated.conversationId));
        },
        onError: (e) => {
          toast.show({ message: apiErrorMessage(e), tone: 'danger' });
          setAccepting(null);
        },
      },
    );
  };
  const onReject = (): void => {
    if (!rejecting) return;
    action.mutate(
      { id: rejecting.id, action: 'reject' },
      {
        onSuccess: () => {
          toast.show({ message: t('applicants.toast.rejected'), tone: 'success' });
          setRejecting(null);
        },
        onError: (e) => {
          toast.show({ message: apiErrorMessage(e), tone: 'danger' });
          setRejecting(null);
        },
      },
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('applicants.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.applications}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <ApplicantRow application={item} onAccept={setAccepting} onReject={setRejecting} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title={t('applicants.empty')} message={t('applicants.emptyHint')} />
          }
          contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge }}
        />
      )}

      <ConfirmationDialog
        visible={accepting != null}
        title={t('applicants.acceptConfirmTitle')}
        message={t('applicants.acceptConfirmBody')}
        confirmLabel={t('applicants.accept')}
        loading={action.isPending}
        onConfirm={onAccept}
        onCancel={() => setAccepting(null)}
      />
      <ConfirmationDialog
        visible={rejecting != null}
        title={t('applicants.rejectConfirmTitle')}
        message={t('applicants.rejectConfirmBody')}
        confirmLabel={t('applicants.reject')}
        destructive
        loading={action.isPending}
        onConfirm={onReject}
        onCancel={() => setRejecting(null)}
      />
    </SafeAreaScreen>
  );
}

function ApplicantRow({
  application,
  onAccept,
  onReject,
}: {
  application: VetJobApplication;
  onAccept: (a: VetJobApplication) => void;
  onReject: (a: VetJobApplication) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const toast = useToast();
  const [endingHire, setEndingHire] = useState(false);
  // Reuses the existing chat "إيقاف المحادثة" capability — no new chat system.
  const closeConversation = useCloseConversation(application.conversationId ?? '');

  const onEndHiring = (): void => {
    closeConversation.mutate(undefined, {
      onSuccess: () => setEndingHire(false),
      onError: (e) => {
        toast.show({ message: apiErrorMessage(e), tone: 'danger' });
        setEndingHire(false);
      },
    });
  };

  return (
    <Card variant="outlined" padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {application.photoUrl ? (
            <Image source={{ uri: application.photoUrl }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Icon name="person" size="iconMd" color="primary" />
          )}
        </View>
        <View style={{ flex: 1, rowGap: 4 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {application.fullName}
          </Text>
          <Caption numberOfLines={1}>{application.specialty ?? application.phone}</Caption>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
            <VetJobApplicationStatusBadge status={application.status} />
            <Caption>{formatDate(application.createdAt)}</Caption>
          </View>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          columnGap: theme.spacing.md,
          marginTop: theme.spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        {application.status === 'PENDING' ? (
          <>
            <Button label={t('applicants.accept')} size="sm" onPress={() => onAccept(application)} />
            <Button
              label={t('applicants.reject')}
              variant="danger"
              size="sm"
              onPress={() => onReject(application)}
            />
          </>
        ) : application.conversationId ? (
          <>
            <TextButton
              label={t('applicants.contact')}
              onPress={() => router.push(Routes.chatThread(application.conversationId as string))}
            />
            <TextButton label={t('applicants.endHiring')} tone="danger" onPress={() => setEndingHire(true)} />
          </>
        ) : null}
      </View>

      <ConfirmationDialog
        visible={endingHire}
        title={t('applicants.endHiringConfirmTitle')}
        message={t('applicants.endHiringConfirmBody')}
        confirmLabel={t('applicants.endHiring')}
        destructive
        loading={closeConversation.isPending}
        onConfirm={onEndHiring}
        onCancel={() => setEndingHire(false)}
      />
    </Card>
  );
}
