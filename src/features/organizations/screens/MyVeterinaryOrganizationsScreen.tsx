import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, SectionList, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { OwnedOrganizationCard } from '../components';
import { useOrganizations } from '../hooks';
import type { MyOrganization, OrganizationType } from '../types';

/**
 * Section order + title key — only types the vet-mode screen covers.
 * `titleKey` is a literal union (not widened to `string`) so `t(titleKey)`
 * still resolves through i18next's typed overloads.
 */
type SectionTitleKey = 'list.sectionClinics' | 'list.sectionOffices' | 'list.sectionFarms';
const SECTION_DEFS: readonly { type: OrganizationType; titleKey: SectionTitleKey }[] = [
  { type: 'CLINIC', titleKey: 'list.sectionClinics' },
  { type: 'VETERINARY_OFFICE', titleKey: 'list.sectionOffices' },
  { type: 'FARM', titleKey: 'list.sectionFarms' },
];
const VETERINARY_ORG_TYPES = new Set(SECTION_DEFS.map((s) => s.type));

/**
 * Veterinarian-mode replacement for the "animals" tab (`app/(app)/(tabs)/animals.tsx`)
 * — the vet's owned/managed Veterinary Offices and Clinics, per the reference
 * screenshot's owned-office card (owner badge, status, subscription, stats,
 * "دخول لوحة التحكم"), plus any poultry/sheep/cattle FARM the vet has linked to
 * via a join code (`JoinFarmScreen` — `Routes.veterinarianJoinFarm`, already
 * built, just not reachable from here before). Grouped into one section per
 * org type (`SECTION_DEFS`) rather than one flat list. A FARM card opens the
 * dedicated Farm Details screen (`Routes.poultryFarmDetail` —
 * `PoultryFarmDetailsScreen`, the same destination `PoultryFarmsLandingScreen`
 * uses; despite the route's "poultry" naming it's the generic farm dashboard,
 * gated by `isFarm` + the vet's granted `farm.*` permissions, not a
 * species-specific screen) rather than the generic `OrganizationDetailsScreen`
 * a CLINIC/OFFICE card uses. Backend-scoped like `MyOrganizationsScreen`,
 * filtered client-side to the org types this section covers.
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

  const sections = useMemo(
    () =>
      SECTION_DEFS.map(({ type, titleKey }) => ({
        title: t(titleKey),
        type,
        data: items.filter((o) => o.type === type),
      })).filter((section) => section.data.length > 0),
    [items, t],
  );

  const goToDetail = (org: MyOrganization) => router.push(Routes.organizationDetail(org.id));
  const goToDashboard = (org: MyOrganization) => {
    if (org.type === 'VETERINARY_OFFICE') return router.push(Routes.vetOfficeDashboard(org.id));
    if (org.type === 'FARM') return router.push(Routes.poultryFarmDetail(org.id));
    return goToDetail(org);
  };
  const openCreatePicker = () => setPickerOpen(true);
  const goToRegister = (type: 'CLINIC' | 'VETERINARY_OFFICE') => {
    setPickerOpen(false);
    router.push(
      type === 'CLINIC' ? Routes.organizationRegisterClinic : Routes.organizationRegisterOffice,
    );
  };
  const goToJoinFarm = () => {
    setPickerOpen(false);
    router.push(Routes.veterinarianJoinFarm);
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
        <SectionList
          sections={sections}
          keyExtractor={(o) => o.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View
              style={{
                paddingTop: theme.spacing.md,
                paddingBottom: theme.spacing.sm,
                backgroundColor: theme.colors.background,
              }}
            >
              <Label>{`${section.title} (${section.data.length})`}</Label>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={{ paddingBottom: theme.spacing.md }}>
              <OwnedOrganizationCard
                organization={item}
                onPress={() => goToDashboard(item)}
                onEnterDashboard={() => goToDashboard(item)}
              />
            </View>
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
            paddingBottom: theme.spacing.huge,
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
          <PickerMenuItem
            icon="medkit-outline"
            title={t('type.CLINIC')}
            hint={t('createPicker.clinicHint')}
            onPress={() => goToRegister('CLINIC')}
          />
          <PickerMenuItem
            icon="business-outline"
            title={t('type.VETERINARY_OFFICE')}
            hint={t('createPicker.officeHint')}
            onPress={() => goToRegister('VETERINARY_OFFICE')}
          />
          <PickerMenuItem
            icon="link-outline"
            title={t('createPicker.linkFarmTitle')}
            hint={t('createPicker.linkFarmHint')}
            onPress={goToJoinFarm}
          />
        </View>
      </BottomSheet>
    </SafeAreaScreen>
  );
}

function PickerMenuItem({
  icon,
  title,
  hint,
  onPress,
}: {
  icon: 'medkit-outline' | 'business-outline' | 'link-outline';
  title: string;
  hint: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
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
      <Icon name={icon} size="iconMd" color="primary" />
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyMedium" weight="bold">
          {title}
        </Text>
        <Caption>{hint}</Caption>
      </View>
    </Pressable>
  );
}
