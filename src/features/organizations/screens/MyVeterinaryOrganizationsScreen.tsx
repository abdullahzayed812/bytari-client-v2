import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { OwnedOrganizationCard } from '../components';
import { useOrganizations } from '../hooks';
import type { MyOrganization } from '../types';

const VETERINARY_ORG_TYPES = new Set(['VETERINARY_OFFICE', 'CLINIC']);

/**
 * Veterinarian-mode replacement for the "animals" tab (`app/(app)/(tabs)/animals.tsx`)
 * — the vet's owned/managed Veterinary Offices and Clinics, per the reference
 * screenshot's owned-office card (owner badge, status, subscription, stats,
 * "دخول لوحة التحكم"). Backend-scoped like `MyOrganizationsScreen`, filtered
 * client-side to the two org types this section covers.
 */
export default function MyVeterinaryOrganizationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const q = useOrganizations({ pageSize: 50 });
  const [pickerOpen, setPickerOpen] = useState(false);

  const items = useMemo(
    () => q.organizations.filter((o) => VETERINARY_ORG_TYPES.has(o.type)),
    [q.organizations],
  );

  const goToDetail = (org: MyOrganization) => router.push(Routes.organizationDetail(org.id));
  const openCreatePicker = () => setPickerOpen(true);
  const goToRegister = (type: 'CLINIC' | 'VETERINARY_OFFICE') => {
    setPickerOpen(false);
    router.push(
      type === 'CLINIC' ? Routes.organizationRegisterClinic : Routes.organizationRegisterOffice,
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('list.myVeterinaryOrgsTitle')}
        right={
          <IconButton
            icon="add"
            variant="soft"
            accessibilityLabel={t('list.createCta')}
            onPress={openCreatePicker}
          />
        }
      />

      {q.isLoading ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <Loading />
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <OwnedOrganizationCard
              organization={item}
              onPress={() => goToDetail(item)}
              onEnterDashboard={() =>
                item.type === 'VETERINARY_OFFICE'
                  ? router.push(Routes.vetOfficeDashboard(item.id))
                  : goToDetail(item)
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title={t('list.myVeterinaryOrgsEmpty')}
              message={t('list.myVeterinaryOrgsEmptyHint')}
              actionLabel={t('list.createCta')}
              onAction={openCreatePicker}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching && !q.isFetchingNextPage}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}

      <BottomSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t('createPicker.title')}
      >
        <View style={{ rowGap: theme.spacing.xs }}>
          <Pressable
            accessibilityRole="menuitem"
            onPress={() => goToRegister('CLINIC')}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: theme.spacing.md,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.md,
              },
              pressed && { backgroundColor: theme.colors.surfaceAccent },
            ]}
          >
            <Icon name="medkit-outline" size="iconMd" color="primary" />
            <View style={{ flex: 1, rowGap: 2 }}>
              <Text variant="bodyMedium" weight="bold">
                {t('type.CLINIC')}
              </Text>
              <Caption>{t('createPicker.clinicHint')}</Caption>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="menuitem"
            onPress={() => goToRegister('VETERINARY_OFFICE')}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: theme.spacing.md,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.md,
              },
              pressed && { backgroundColor: theme.colors.surfaceAccent },
            ]}
          >
            <Icon name="business-outline" size="iconMd" color="primary" />
            <View style={{ flex: 1, rowGap: 2 }}>
              <Text variant="bodyMedium" weight="bold">
                {t('type.VETERINARY_OFFICE')}
              </Text>
              <Caption>{t('createPicker.officeHint')}</Caption>
            </View>
          </Pressable>
        </View>
      </BottomSheet>
    </SafeAreaScreen>
  );
}
