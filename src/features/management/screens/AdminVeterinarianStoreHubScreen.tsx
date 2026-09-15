import { useTranslation } from 'react-i18next';

import { Routes } from '@/constants/routes';

import { AdminHubScreen } from '../components/AdminHubScreen';

/** Route `/admin/veterinarian-store-hub` — the "متجر الأطباء البيطريين" dashboard card. */
export default function AdminVeterinarianStoreHubScreen() {
  const { t: ta } = useTranslation('admin');
  const { t: tv } = useTranslation('veterinarianStore');

  return (
    <AdminHubScreen
      title={ta('hubs.veterinarianStore.title')}
      intro={ta('hubs.veterinarianStore.intro')}
      entries={[
        {
          key: 'products',
          label: tv('admin.entry.products'),
          icon: 'bag-outline',
          route: Routes.adminVetStoreProducts,
        },
        {
          key: 'categories',
          label: tv('admin.entry.categories'),
          icon: 'pricetags-outline',
          route: Routes.adminVetStoreCategories,
        },
        {
          key: 'orders',
          label: tv('admin.entry.orders'),
          icon: 'receipt-outline',
          route: Routes.adminVetStoreOrders,
        },
      ]}
    />
  );
}
