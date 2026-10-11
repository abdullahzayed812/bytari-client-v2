import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
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
  vaccinationsCount: number;
  remindersCount: number;
}

/** `GET /animals/:petId/clinics` — current owner (or ADMIN) only, enforced by the backend. */
export function usePetClinics(petId: string | undefined, enabled = true) {
  return useQuery<PetClinic[], ApiError>({
    queryKey: ['pets', petId, 'clinics'],
    queryFn: () => apiClient.get<PetClinic[]>(`/animals/${petId}/clinics`),
    enabled: Boolean(petId) && enabled,
  });
}

/** One clinic that added vaccinations / reminders for the pet — profile + chat. */
export function PetClinicCard({ clinic }: { clinic: PetClinic }) {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const toast = useToast();
  const start = useStartConversation();
  return (
    <Card
      variant="outlined"
      padding="md"
      onPress={() => router.push(Routes.organizationDiscoverDetail(clinic.organizationId))}
      accessibilityLabel={clinic.name}
    >
      <Row gap="md">
        {clinic.logoUrl ? (
          <Image
            source={{ uri: clinic.logoUrl }}
            style={{ width: 40, height: 40, borderRadius: theme.radius.pill }}
          />
        ) : (
          <Icon name="medkit-outline" size="iconLg" color="primary" />
        )}
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {clinic.name}
          </Text>
          <Caption>
            {t('clinics.counts', {
              vaccinations: clinic.vaccinationsCount,
              reminders: clinic.remindersCount,
            })}
          </Caption>
        </View>
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
              { organizationId: clinic.organizationId },
              {
                onSuccess: (c) => router.push(Routes.chatThread(c.id)),
                onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
              },
            )
          }
        />
      </View>
    </Card>
  );
}

/**
 * Route `/pets/[petId]/clinics` — legacy owner tab "العيادات التي زارها الحيوان":
 * the clinics that added vaccinations / reminders for the pet (the only
 * owner-visible clinic additions), with those counts, its profile, and a chat
 * with the clinic. Pet Details shows the same list inline in its "العيادات" tab.
 * Current owner (or ADMIN) only — enforced by the backend.
 */
export default function PetClinicsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const q = usePetClinics(petId);

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
          renderItem={({ item }) => <PetClinicCard clinic={item} />}
        />
      )}
    </SafeAreaScreen>
  );
}
