import type { Href } from 'expo-router';

import type { IconName } from '@/components/content';
import { Routes } from '@/constants/routes';
import type { AdminDashboardCardId } from '@/features/admin/types';
import type { Capabilities } from '@/hooks/useCapabilities';

import { dashboardTint, type DashboardTint } from '../components/AdminDashboardCard';

export interface DashboardCardDef {
  id: AdminDashboardCardId;
  icon: IconName;
  tint: DashboardTint;
  route: Href;
  /** Same RBAC gating the pre-redesign `ManagementScreen` used per area — unchanged, only the presentation changed. */
  show: (caps: Capabilities) => boolean;
}

/**
 * Every card in the redesigned admin dashboard grid, in screenshot order.
 * `show` mirrors exactly what the old plain-list `ManagementScreen` checked
 * per area — this redesign changes presentation and adds real counts, not
 * who can see what.
 */
export const DASHBOARD_CARD_DEFS: DashboardCardDef[] = [
  {
    id: 'poultry',
    icon: 'egg-outline',
    tint: dashboardTint(0),
    route: { pathname: Routes.adminFarms, params: { species: 'POULTRY' } },
    show: (c) => c.isAdmin || c.can('organization.admin.read'),
  },
  {
    id: 'pets',
    icon: 'paw-outline',
    tint: dashboardTint(2),
    route: Routes.adminAnimals,
    show: (c) => c.isAdmin || c.isSupervisorOf('ANIMAL') || c.can('animal.read'),
  },
  {
    id: 'consultations',
    icon: 'medkit-outline',
    tint: dashboardTint(5),
    route: Routes.supportManage('consultations'),
    show: (c) => c.isAdmin || c.isSupervisorOf('CONSULTATION') || c.can('consultation.admin.read'),
  },
  {
    id: 'inquiries',
    icon: 'chatbubble-ellipses-outline',
    tint: dashboardTint(3),
    route: Routes.supportManage('inquiries'),
    show: (c) => c.isAdmin || c.isSupervisorOf('INQUIRY') || c.can('inquiry.admin.read'),
  },
  {
    id: 'ads',
    icon: 'megaphone-outline',
    tint: dashboardTint(4),
    route: Routes.adminAds,
    show: (c) => c.isAdmin || c.isSupervisorOf('ADVERTISEMENT') || c.can('advertisement.manage'),
  },
  {
    id: 'clinics',
    icon: 'medical-outline',
    tint: dashboardTint(1),
    route: { pathname: Routes.adminOrganizations, params: { type: 'CLINIC' } },
    show: (c) => c.isAdmin || c.can('organization.admin.read'),
  },
  {
    id: 'offices',
    icon: 'business-outline',
    tint: dashboardTint(7),
    route: { pathname: Routes.adminOrganizations, params: { type: 'VETERINARY_OFFICE' } },
    show: (c) => c.isAdmin || c.can('organization.admin.read'),
  },
  {
    id: 'vetApprovals',
    icon: 'shield-checkmark-outline',
    tint: dashboardTint(2),
    route: Routes.adminVetApplications,
    show: (c) => c.isAdmin || c.can('veterinarian.read'),
  },
  {
    id: 'livestock',
    icon: 'nutrition-outline',
    tint: dashboardTint(3),
    route: { pathname: Routes.adminFarms, params: { species: 'LIVESTOCK' } },
    show: (c) => c.isAdmin || c.can('organization.admin.read'),
  },
  {
    id: 'courses',
    icon: 'school-outline',
    tint: dashboardTint(3),
    route: Routes.adminVetCourses,
    show: (c) => c.isAdmin || c.isSupervisorOf('VET_COURSES') || c.can('vet_course.read'),
  },
  {
    id: 'services',
    icon: 'settings-outline',
    tint: dashboardTint(5),
    route: Routes.adminServicesHub,
    show: (c) => c.isAdmin || c.isSupervisorOf('VET_SERVICE') || c.can('vet_service.read'),
  },
  {
    id: 'content',
    icon: 'library-outline',
    tint: dashboardTint(2),
    route: Routes.adminContentHub,
    show: (c) => c.isAdmin || c.isSupervisorOf('CONTENT') || c.can('content.read'),
  },
  {
    id: 'syndicate',
    icon: 'ribbon-outline',
    tint: dashboardTint(0),
    route: { pathname: Routes.adminOrganizations, params: { type: 'SYNDICATE' } },
    show: (c) => c.isAdmin || c.can('organization.admin.read'),
  },
  {
    id: 'petOwners',
    icon: 'people-outline',
    tint: dashboardTint(1),
    route: { pathname: Routes.adminUsers, params: { role: 'PET_OWNER' } },
    show: (c) => c.isAdmin || c.can('user.read'),
  },
  {
    id: 'veterinarians',
    icon: 'person-outline',
    tint: dashboardTint(4),
    route: { pathname: Routes.adminUsers, params: { role: 'VETERINARIAN' } },
    show: (c) => c.isAdmin || c.can('user.read'),
  },
  {
    id: 'chats',
    icon: 'chatbubbles-outline',
    tint: dashboardTint(6),
    route: Routes.adminChats,
    show: (c) => c.isAdmin || c.can('chat.read'),
  },
  {
    id: 'jobs',
    icon: 'briefcase-outline',
    tint: dashboardTint(4),
    route: Routes.adminJobsHub,
    show: (c) => c.isAdmin || c.isSupervisorOf('VET_JOBS') || c.can('vet_job.read'),
  },
  {
    id: 'supervisors',
    icon: 'people-circle-outline',
    tint: dashboardTint(2),
    route: Routes.adminSupervisors,
    show: (c) => c.isAdmin || c.can('supervisor.read'),
  },
  {
    id: 'petOwnerStore',
    icon: 'cart-outline',
    tint: dashboardTint(5),
    route: Routes.adminPetOwnerStoreHub,
    show: (c) =>
      c.isAdmin || c.isSupervisorOf('PET_OWNER_STORE') || c.can('pet_store.product.manage'),
  },
  {
    id: 'veterinarianStore',
    icon: 'bag-outline',
    tint: dashboardTint(6),
    route: Routes.adminVeterinarianStoreHub,
    show: (c) =>
      c.isAdmin ||
      c.isSupervisorOf('VETERINARIAN_STORE') ||
      c.can('veterinarian_store.product.manage'),
  },
  {
    id: 'users',
    icon: 'key-outline',
    tint: dashboardTint(7),
    route: Routes.adminUsers,
    show: (c) => c.isAdmin || c.can('user.read'),
  },
  {
    id: 'userMessages',
    icon: 'mail-outline',
    tint: dashboardTint(0),
    route: Routes.supportManage('support-messages'),
    show: (c) => c.isAdmin || c.isSupervisorOf('SUPPORT') || c.can('support.admin.read'),
  },
  {
    id: 'broadcasts',
    icon: 'paper-plane-outline',
    tint: dashboardTint(3),
    route: Routes.adminBroadcast,
    show: (c) => c.isAdmin || c.can('notification.admin.send'),
  },
];
