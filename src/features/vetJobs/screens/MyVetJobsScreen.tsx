import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SegmentedControl } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { VetJobApplicationStatusBadge, VetJobStatusBadge } from '../components';
import { useCloseVetJobOffer, useDeleteVetJobOffer, useMyVetJobApplications, useMyVetJobOffers } from '../hooks';
import type { VetJobApplication, VetJobOffer } from '../types';

type Tab = 'ads' | 'applications';

/** Route `/(app)/vet-jobs/my` — "إعلاناتي وطلباتي" (reference screenshot 12). */
export default function MyVetJobsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('ads');

  const offers = useMyVetJobOffers(undefined, { enabled: tab === 'ads' });
  const applications = useMyVetJobApplications(undefined, { enabled: tab === 'applications' });
  const closeOffer = useCloseVetJobOffer();
  const deleteOffer = useDeleteVetJobOffer();
  const [deleting, setDeleting] = useState<VetJobOffer | null>(null);

  const onDelete = (): void => {
    if (!deleting) return;
    deleteOffer.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
      onError: (e) => {
        toast.show({ message: apiErrorMessage(e), tone: 'danger' });
        setDeleting(null);
      },
    });
  };

  const onClose = (offer: VetJobOffer): void => {
    closeOffer.mutate(offer.id, {
      onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    });
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('myJobs.title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'applications', label: t('myJobs.tabApplications') },
            { value: 'ads', label: t('myJobs.tabAds') },
          ]}
        />
      </View>

      {tab === 'ads' ? (
        offers.isLoading ? (
          <Loading fill />
        ) : offers.isError ? (
          <View style={{ padding: theme.screenPadding }}>
            <ErrorState error={offers.error} onRetry={() => void offers.refetch()} />
          </View>
        ) : (
          <FlatList
            data={offers.offers}
            keyExtractor={(o) => o.id}
            renderItem={({ item }) => (
              <Card variant="outlined" padding="md">
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.md }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.primarySoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="briefcase-outline" size="iconMd" color="primary" />
                  </View>
                  <View style={{ flex: 1, rowGap: 4 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Caption numberOfLines={1}>{item.organizationName}</Caption>
                    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
                      <VetJobStatusBadge status={item.status} />
                      <Caption>{formatDate(item.createdAt)}</Caption>
                    </View>
                    {item.status === 'REJECTED' && item.rejectionReason ? (
                      <Caption color="danger">{item.rejectionReason}</Caption>
                    ) : null}
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
                  <TextButton label={t('myJobs.view')} onPress={() => router.push(Routes.vetJobOfferApplicants(item.id))} />
                  <TextButton label={t('myJobs.edit')} onPress={() => router.push(Routes.vetJobOfferEdit(item.id))} />
                  {item.status === 'APPROVED' && !item.closedAt ? (
                    <TextButton label={t('myJobs.closeAd')} tone="danger" onPress={() => onClose(item)} />
                  ) : null}
                  <TextButton label={t('myJobs.delete')} tone="danger" onPress={() => setDeleting(item)} />
                </View>
              </Card>
            )}
            ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
            ListEmptyComponent={<EmptyState icon="briefcase-outline" title={t('myJobs.empty')} />}
            ListFooterComponent={
              <View
                style={{
                  marginTop: theme.spacing.lg,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.primarySoft,
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: theme.spacing.sm,
                }}
              >
                <Icon name="information-circle-outline" color="primary" />
                <View style={{ flex: 1 }}>
                  <Text variant="label" color="primary">
                    {t('myJobs.noteTitle')}
                  </Text>
                  <Caption>{t('myJobs.noteBody')}</Caption>
                </View>
              </View>
            }
            contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge }}
          />
        )
      ) : applications.isLoading ? (
        <Loading fill />
      ) : applications.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={applications.error} onRetry={() => void applications.refetch()} />
        </View>
      ) : (
        <FlatList
          data={applications.applications}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => <ApplicationRow application={item} />}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title={t('myJobs.emptyApplications')} />}
          contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge }}
        />
      )}

      <ConfirmationDialog
        visible={deleting != null}
        title={t('myJobs.deleteConfirmTitle')}
        message={t('myJobs.deleteConfirmBody')}
        confirmLabel={t('myJobs.delete')}
        destructive
        loading={deleteOffer.isPending}
        onConfirm={onDelete}
        onCancel={() => setDeleting(null)}
      />
    </SafeAreaScreen>
  );
}

function ApplicationRow({ application }: { application: VetJobApplication }) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      padding="md"
      onPress={() => application.offer && router.push(Routes.vetJobOffer(application.offer.id))}
    >
      <View style={{ rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {application.offer?.title ?? ''}
        </Text>
        <Caption numberOfLines={1}>{application.offer?.organizationName ?? ''}</Caption>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <VetJobApplicationStatusBadge status={application.status} />
          <Caption>{formatDate(application.createdAt)}</Caption>
        </View>
      </View>
    </Card>
  );
}
