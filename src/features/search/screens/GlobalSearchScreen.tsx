import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, SectionList, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { SEARCH_MIN_CHARS, useGlobalSearch } from '../hooks/useGlobalSearch';
import type { SearchHit, SearchType } from '../types';

const TYPE_ICON: Record<SearchType, IconName> = {
  BOOK: 'book-outline',
  MAGAZINE: 'newspaper-outline',
  PET_STORE_PRODUCT: 'cart-outline',
  VET_STORE_PRODUCT: 'medkit-outline',
  CLINIC: 'medical-outline',
  VETERINARY_OFFICE: 'business-outline',
  FARM: 'leaf-outline',
  SERVICE: 'briefcase-outline',
  COURSE: 'school-outline',
  JOB: 'id-card-outline',
  NEWS: 'megaphone-outline',
  TIP: 'bulb-outline',
};

/** Where tapping a result goes — each type opens its existing detail screen. */
export function searchHitHref(hit: SearchHit): Href {
  switch (hit.type) {
    case 'BOOK':
      return Routes.veterinaryBooksDetail(hit.id);
    case 'MAGAZINE':
      return Routes.veterinaryMagazineArticle(hit.id);
    case 'PET_STORE_PRODUCT':
      return Routes.petOwnerStoreProduct(hit.id);
    case 'VET_STORE_PRODUCT':
      return Routes.veterinarianStoreProduct(hit.id);
    case 'CLINIC':
      return Routes.organizationDiscoverDetail(hit.id);
    case 'VETERINARY_OFFICE':
      return Routes.veterinaryOfficeDetail(hit.id);
    case 'FARM':
      return Routes.farmDashboard(hit.id, hit.meta?.farmSpecies);
    case 'SERVICE':
      return Routes.vetServiceListing(hit.id);
    case 'COURSE':
      return Routes.vetCourse(hit.id);
    case 'JOB':
      return Routes.vetJobOffer(hit.id);
    case 'NEWS':
      return Routes.newsDetail(hit.id);
    case 'TIP':
      return Routes.tip(hit.id);
  }
}

/** Route `/(app)/search` — the Home header global search, scoped to the active interface. */
export default function GlobalSearchScreen() {
  const theme = useTheme();
  const { t } = useTranslation('home');
  const [text, setText] = useState('');
  const q = useGlobalSearch(text);
  const placeholder =
    q.scope === 'VETERINARIAN' ? t('search.placeholderVet') : t('search.placeholder');

  const sections = (q.data?.groups ?? []).map((g) => ({
    type: g.type,
    total: g.total,
    data: g.items,
  }));

  const body = !q.enabled ? (
    <EmptyState icon="search-outline" title={t('search.title')} message={t('search.hint')} />
  ) : q.isLoading ? (
    <Loading fill />
  ) : q.isError ? (
    <View style={{ padding: theme.screenPadding }}>
      <ErrorState error={q.error} onRetry={() => void q.refetch()} />
    </View>
  ) : (
    <SectionList
      sections={sections}
      keyExtractor={(hit) => `${hit.type}:${hit.id}`}
      keyboardShouldPersistTaps="handled"
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.xs,
          }}
        >
          <Text variant="bodyStrong">{t(`search.types.${section.type}`)}</Text>
          <Caption>{t('search.count', { count: section.total })}</Caption>
        </View>
      )}
      renderItem={({ item }) => <SearchRow hit={item} />}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing.xs }} />}
      ListEmptyComponent={
        <EmptyState
          icon="search-outline"
          title={t('search.empty')}
          message={t('search.emptyHint')}
        />
      }
      contentContainerStyle={{
        paddingHorizontal: theme.screenPadding,
        paddingBottom: theme.spacing.huge,
        flexGrow: 1,
      }}
    />
  );

  return (
    <SafeAreaScreen>
      <AppHeader title={t('search.title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <SearchInput
          value={text}
          onChangeText={setText}
          onClear={() => setText('')}
          placeholder={placeholder}
          accessibilityLabel={placeholder}
          autoFocus
          returnKeyType="search"
          maxLength={120}
        />
        {text.trim().length > 0 && text.trim().length < SEARCH_MIN_CHARS ? (
          <Caption style={{ marginTop: theme.spacing.xs }}>{t('search.hint')}</Caption>
        ) : null}
      </View>
      {body}
    </SafeAreaScreen>
  );
}

function SearchRow({ hit }: { hit: SearchHit }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hit.title}
      onPress={() => router.push(searchHitHref(hit))}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.md,
          padding: theme.spacing.sm,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {hit.imageUrl ? (
          <Image
            source={{ uri: hit.imageUrl }}
            style={{ width: 44, height: 44 }}
            contentFit="cover"
          />
        ) : (
          <Icon name={TYPE_ICON[hit.type]} size="iconSm" color="primary" />
        )}
      </View>
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {hit.title}
        </Text>
        {hit.subtitle ? <Caption numberOfLines={1}>{hit.subtitle}</Caption> : null}
      </View>
      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
