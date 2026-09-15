import { useTranslation } from 'react-i18next';

import { Routes } from '@/constants/routes';

import { AdminHubScreen } from '../components/AdminHubScreen';

/** Route `/admin/pet-owner-store-hub` — the "متجر أصحاب الحيوانات" dashboard card. */
export default function AdminPetOwnerStoreHubScreen() {
  const { t: ta } = useTranslation('admin');
  const { t: tp } = useTranslation('petOwnerStore');

  return (
    <AdminHubScreen
      title={ta('hubs.petOwnerStore.title')}
      intro={ta('hubs.petOwnerStore.intro')}
      entries={[
        {
          key: 'products',
          label: tp('admin.entry.products'),
          icon: 'cart-outline',
          route: Routes.adminPetStoreProducts,
        },
        {
          key: 'categories',
          label: tp('admin.entry.categories'),
          icon: 'pricetags-outline',
          route: Routes.adminPetStoreCategories,
        },
        {
          key: 'orders',
          label: tp('admin.entry.orders'),
          icon: 'receipt-outline',
          route: Routes.adminPetStoreOrders,
        },
      ]}
    />
  );
}
