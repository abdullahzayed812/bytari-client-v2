import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { SegmentedControl } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { AdminContentList } from '@/features/content/admin';
import { useTheme } from '@/theme';

type ContentTab = 'BOOK' | 'MAGAZINE';

/**
 * Route `/admin/content-hub` — the "الكتب والمجلات" dashboard card: ONE
 * management screen with Books / Magazines tabs. Each tab is the existing
 * `GET /admin/content?type=` list (same create / detail / edit / cover-upload
 * screens); the two types stay separate on the server. A `?type=` deep link
 * pre-selects a tab. Categories, tips and news stay one tap away.
 */
export default function AdminContentHubScreen() {
  const theme = useTheme();
  const { t: ta } = useTranslation('admin');
  const { t: tc } = useTranslation('content');
  const params = useLocalSearchParams<{ type?: string }>();
  const [type, setType] = useState<ContentTab>(params.type === 'MAGAZINE' ? 'MAGAZINE' : 'BOOK');

  return (
    <SafeAreaScreen>
      <AppHeader
        title={ta('hubs.content.title')}
        showBack
        right={
          <IconButton
            icon="add"
            accessibilityLabel={tc('admin.list.add')}
            onPress={() => router.push(Routes.adminVeterinaryContentCreate(type))}
          />
        }
      />
      <View
        style={{
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.sm,
          rowGap: theme.spacing.sm,
        }}
      >
        <SegmentedControl<ContentTab>
          value={type}
          onChange={setType}
          options={[
            { value: 'BOOK', label: ta('hubs.content.tabs.BOOK') },
            { value: 'MAGAZINE', label: ta('hubs.content.tabs.MAGAZINE') },
          ]}
        />
        <Caption>{ta('hubs.content.relatedLabel')}</Caption>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ columnGap: theme.spacing.xs }}
        >
          <Chip
            icon="pricetags-outline"
            label={tc('admin.entry.categories')}
            onPress={() => router.push(Routes.adminVeterinaryContentCategories)}
          />
          <Chip
            icon="bulb-outline"
            label={ta('editorial.title.tips')}
            onPress={() => router.push(Routes.adminEditorial('tips'))}
          />
          <Chip
            icon="newspaper-outline"
            label={ta('editorial.title.news')}
            onPress={() => router.push(Routes.adminEditorial('news'))}
          />
        </ScrollView>
      </View>
      <AdminContentList key={type} type={type} />
    </SafeAreaScreen>
  );
}
