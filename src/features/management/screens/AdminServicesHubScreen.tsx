import { useTranslation } from 'react-i18next';

import { Routes } from '@/constants/routes';

import { AdminHubScreen } from '../components/AdminHubScreen';

/** Route `/admin/services-hub` — the "الخدمات" dashboard card (listings + requests). */
export default function AdminServicesHubScreen() {
  const { t: ta } = useTranslation('admin');

  return (
    <AdminHubScreen
      title={ta('hubs.services.title')}
      intro={ta('hubs.services.intro')}
      entries={[
        {
          key: 'listings',
          label: ta('vetServiceListings.title'),
          icon: 'settings-outline',
          route: Routes.adminVetServiceListings,
        },
        {
          key: 'requests',
          label: ta('vetServiceRequests.title'),
          icon: 'document-text-outline',
          route: Routes.adminVetServiceRequests,
        },
      ]}
    />
  );
}
