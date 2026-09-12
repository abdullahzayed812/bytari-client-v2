import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Divider, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useStartConversationWithSeeker, useVetJobSeeker } from '../hooks';

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Caption>{label}</Caption>
      <Text variant="label">{value}</Text>
    </View>
  );
}

/** Route `/(app)/vet-jobs/seekers/[seekerId]` — "تفاصيل الطبيب" (reference screenshot 5). */
export default function VetJobSeekerDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const toast = useToast();
  const { seekerId } = useLocalSearchParams<{ seekerId: string }>();

  const q = useVetJobSeeker(seekerId);
  const startConversation = useStartConversationWithSeeker();
  const profile = q.data;

  const onContact = (): void => {
    if (!profile) return;
    startConversation.mutate(profile.id, {
      onSuccess: ({ conversationId }) => router.push(Routes.chatThread(conversationId)),
      onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    });
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('seeker.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !profile ? (
        <EmptyState icon="person-outline" title={t('seeker.notFound')} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              padding: theme.screenPadding,
              rowGap: theme.spacing.lg,
              paddingBottom: theme.spacing.huge,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: theme.colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {profile.photoUrl ? (
                  <Image source={{ uri: profile.photoUrl }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Icon name="person" size="iconXl" color="primary" />
                )}
              </View>
              <View style={{ flex: 1, rowGap: 4 }}>
                <Heading level={3}>{`${profile.user.firstName} ${profile.user.lastName}`}</Heading>
                <Caption>{profile.specialty}</Caption>
              </View>
            </View>

            {profile.headline ? (
              <View style={{ rowGap: theme.spacing.sm }}>
                <Label>{t('seeker.personalInfo')}</Label>
                <Text variant="body" color="textSecondary">
                  {profile.headline}
                </Text>
              </View>
            ) : null}

            <Card variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.sm }}>
                <Label>{t('seeker.professionalInfo')}</Label>
                <Divider spacing="sm" />
                <InfoRow label={t('seeker.specialty')} value={profile.specialty} />
                <InfoRow label={t('seeker.qualifications')} value={profile.qualifications} />
                <InfoRow label={t('seeker.experienceYears')} value={String(profile.experienceYears)} />
                <InfoRow
                  label={t('seeker.workDuration')}
                  value={
                    profile.preferredEmploymentTypes.length > 0
                      ? profile.preferredEmploymentTypes.map((v) => t(`employmentType.${v}`)).join('، ')
                      : null
                  }
                />
                <InfoRow
                  label={t('seeker.location')}
                  value={[profile.governorate, profile.district].filter(Boolean).join(' - ')}
                />
              </View>
            </Card>

            {profile.skills.length > 0 ? (
              <View style={{ rowGap: theme.spacing.sm }}>
                <Label>{t('seeker.skills')}</Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  {profile.skills.map((s) => (
                    <View
                      key={s}
                      style={{
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.xs,
                        borderRadius: theme.radius.pill,
                        backgroundColor: theme.colors.primarySoft,
                      }}
                    >
                      <Caption color="primary">{s}</Caption>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {profile.cvUrl ? (
              <View style={{ rowGap: theme.spacing.sm }}>
                <Label>{t('seeker.cv')}</Label>
                <Card
                  variant="outlined"
                  padding="md"
                  onPress={() => void Linking.openURL(profile.cvUrl as string)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
                    <Icon name="document-text-outline" size="iconMd" color="primary" />
                    <Text variant="body" style={{ flex: 1 }}>
                      {t('seeker.cv')}
                    </Text>
                    <Icon name="download-outline" size="iconSm" color="primary" />
                  </View>
                </Card>
              </View>
            ) : null}
          </ScrollView>

          <View
            style={{
              padding: theme.screenPadding,
              rowGap: theme.spacing.sm,
              borderTopWidth: theme.sizes.hairline,
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.background,
            }}
          >
            {/* Reference screenshot 5: "حفظ" (bookmark, cosmetic) + "تواصل مع الطبيب". */}
            <Button
              label={t('seeker.contact')}
              fullWidth
              loading={startConversation.isPending}
              onPress={onContact}
            />
          </View>
        </>
      )}
    </SafeAreaScreen>
  );
}
