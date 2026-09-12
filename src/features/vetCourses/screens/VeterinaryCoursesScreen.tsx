import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { useCapabilities, useDebouncedValue } from '@/hooks';
import { useTheme } from '@/theme';

import { CourseCard } from '../components';
import { useVetCourses } from '../hooks';
import { VET_COURSE_TYPES, type CourseBrowseFilter, type VetCourseType } from '../types';

/** Route `/(app)/vet-courses` — "الدورات والندوات" (reference screenshot 1). */
export default function VeterinaryCoursesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetCourses');
  const caps = useCapabilities();

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch);
  const [type, setType] = useState<VetCourseType | undefined>();
  const filter: CourseBrowseFilter = useMemo(() => ({ search: search || undefined, type }), [search, type]);
  const q = useVetCourses(filter);

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('courses.title')}
        showBack
        right={
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.xs }}>
            <IconButton
              icon="bookmark-outline"
              variant="soft"
              accessibilityLabel={t('home.myCourses')}
              onPress={() => router.push(Routes.vetCourseMy)}
            />
            {caps.isApprovedVeterinarian ? (
              <IconButton
                icon="add"
                variant="soft"
                accessibilityLabel={t('courses.addCourse')}
                onPress={() => router.push(Routes.vetCourseNew)}
              />
            ) : null}
          </View>
        }
      />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <SearchInput
          value={rawSearch}
          onChangeText={setRawSearch}
          onClear={() => setRawSearch('')}
          placeholder={t('courses.searchPlaceholder')}
          accessibilityLabel={t('courses.searchPlaceholder')}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          columnGap: theme.spacing.sm,
          paddingHorizontal: theme.screenPadding,
          paddingVertical: theme.spacing.sm,
        }}
      >
        <Chip label={t('filters.all')} selected={!type} onPress={() => setType(undefined)} />
        {VET_COURSE_TYPES.map((v) => (
          <Chip key={v} label={t(`type.${v}`)} selected={type === v} onPress={() => setType(v)} />
        ))}
      </ScrollView>

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.courses}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <CourseCard course={item} onPress={() => router.push(Routes.vetCourse(item.id))} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          ListEmptyComponent={
            <EmptyState icon="school-outline" title={t('courses.empty')} message={t('courses.emptyHint')} />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading label={t('courses.loadingMore')} /> : null}
          contentContainerStyle={{
            padding: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
        />
      )}
    </SafeAreaScreen>
  );
}
