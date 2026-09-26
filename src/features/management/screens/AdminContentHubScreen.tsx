import { useTranslation } from 'react-i18next';

import { Routes } from '@/constants/routes';

import { AdminHubScreen } from '../components/AdminHubScreen';

/** Route `/admin/content-hub` — the "الكتب والمجلات" dashboard card. */
export default function AdminContentHubScreen() {
  const { t: ta } = useTranslation('admin');
  const { t: tc } = useTranslation('content');

  return (
    <AdminHubScreen
      title={ta('hubs.content.title')}
      intro={ta('hubs.content.intro')}
      entries={[
        {
          key: 'magazine',
          label: tc('admin.entry.magazine'),
          icon: 'newspaper-outline',
          route: Routes.adminVeterinaryContent('MAGAZINE'),
        },
        {
          key: 'books',
          label: tc('admin.entry.books'),
          icon: 'book-outline',
          route: Routes.adminVeterinaryContent('BOOK'),
        },
        {
          key: 'tips',
          label: ta('editorial.title.tips'),
          icon: 'bulb-outline',
          route: Routes.adminEditorial('tips'),
        },
        {
          key: 'news',
          label: ta('editorial.title.news'),
          icon: 'newspaper-outline',
          route: Routes.adminEditorial('news'),
        },
        {
          key: 'categories',
          label: tc('admin.entry.categories'),
          icon: 'pricetags-outline',
          route: Routes.adminVeterinaryContentCategories,
        },
      ]}
    />
  );
}
