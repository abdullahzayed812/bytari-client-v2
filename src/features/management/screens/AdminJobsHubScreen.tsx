import { useTranslation } from 'react-i18next';

import { Routes } from '@/constants/routes';

import { AdminHubScreen } from '../components/AdminHubScreen';

/** Route `/admin/jobs-hub` — the "الوظائف المتاحة" dashboard card (offers + seekers). */
export default function AdminJobsHubScreen() {
  const { t: ta } = useTranslation('admin');

  return (
    <AdminHubScreen
      title={ta('hubs.jobs.title')}
      intro={ta('hubs.jobs.intro')}
      entries={[
        {
          key: 'offers',
          label: ta('vetJobOffers.title'),
          icon: 'briefcase-outline',
          route: Routes.adminVetJobOffers,
        },
        {
          key: 'seekers',
          label: ta('vetJobSeekers.title'),
          icon: 'people-outline',
          route: Routes.adminVetJobSeekers,
        },
      ]}
    />
  );
}
