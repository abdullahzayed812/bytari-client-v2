import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { IconButton } from '@/components/actions';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';

import { AdminContentList } from '../components';

/** Route `/(app)/admin/veterinary-content/[type]` — MAGAZINE or BOOK content list. */
export default function AdminContentListScreen() {
  const { t } = useTranslation('content');
  const { type } = useLocalSearchParams<{ type: 'MAGAZINE' | 'BOOK' }>();
  const contentType = type ?? 'MAGAZINE';

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('admin.list.title', { type: t(`type.${contentType}`) })}
        showBack
        right={
          <IconButton
            icon="add"
            accessibilityLabel={t('admin.list.add')}
            onPress={() => router.push(Routes.adminVeterinaryContentCreate(contentType))}
          />
        }
      />
      <AdminContentList type={contentType} />
    </SafeAreaScreen>
  );
}
