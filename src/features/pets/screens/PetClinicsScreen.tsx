import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useStartConversation } from '@/features/chat';
import { apiErrorMessage } from '@/lib/apiError';
import { apiClient, type ApiError } from '@/services/api';
import { useTheme } from '@/theme';

/** `GET /animals/:animalId/clinics` row (server `OwnerAnimalClinicDTO`). */
export interface PetClinic {
  organizationId: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  hasActiveAccess: boolean;
  grantedAt: string | null;
  medicalRecordsCount: number;
  vaccinationsCount: number;
  remindersCount: number;
}

/**
 * Route `/pets/[petId]/clinics` — legacy owner tab "العيادات التي زارها الحيوان":
 * every clinic that treats the pet or recorded anything for it, with record /
 * vaccination / reminder counts, its profile, and a chat with the clinic.
 * Current owner (or ADMIN) only — enforced by the backend.
 */
export default function PetClinicsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const toast = useToast();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const q = useQuery<PetClinic[], ApiError>({
    queryKey: ['pets', petId, 'clinics'],
    queryFn: () => apiClient.get<PetClinic[]>(`/animals/${petId}/clinics`),
    enabled: Boolean(petId),
  });
  const start = useStartConversation();

  return (
    <SafeAreaScreen>
      <AppHeader title={t('clinics.title')} showBack />
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(c) => c.organizationId}
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={<EmptyState icon="medkit-outline" title={t('clinics.empty')} />}
          renderItem={({ item }) => (
            <Card
              variant="outlined"
              padding="md"
              onPress={() => router.push(Routes.organizationDiscoverDetail(item.organizationId))}
              accessibilityLabel={item.name}
            >
              <Row gap="md">
                {item.logoUrl ? (
                  <Image
                    source={{ uri: item.logoUrl }}
                    style={{ width: 40, height: 40, borderRadius: theme.radius.pill }}
                  />
                ) : (
                  <Icon name="medkit-outline" size="iconLg" color="primary" />
                )}
                <View style={{ flex: 1, rowGap: 2 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Caption>
                    {t('clinics.counts', {
                      records: item.medicalRecordsCount,
                      vaccinations: item.vaccinationsCount,
                      reminders: item.remindersCount,
                    })}
                  </Caption>
                </View>
                {item.hasActiveAccess ? (
                  <Badge label={t('clinics.activeAccess')} tone="success" size="sm" />
                ) : null}
              </Row>
              <View style={{ marginTop: theme.spacing.sm }}>
                <Button
                  label={t('clinics.chat')}
                  size="sm"
                  variant="outline"
                  leftIcon="chatbubble-ellipses-outline"
                  disabled={start.isPending}
                  onPress={() =>
                    start.mutate(
                      { organizationId: item.organizationId },
                      {
                        onSuccess: (c) => router.push(Routes.chatThread(c.id)),
                        onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
                      },
                    )
                  }
                />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaScreen>
  );
}
