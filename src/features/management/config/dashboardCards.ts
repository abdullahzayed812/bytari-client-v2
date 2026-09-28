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
  /**
   * Server card ids whose counters this ONE tile aggregates (and marks seen
   * when opened). Used for "الدورات والندوات" — the server keeps separate
   * `courses` / `seminars` counters, the dashboard shows one unified section.
   */
  mergedIds?: AdminDashboardCardId[];
  /** Same RBAC gating the pre-redesign `ManagementScreen` used per area — unchanged, only the presentation changed. */
  show: (caps: Capabilities) => boolean;
}

/**
 * Every card in the redesigned admin dashboard grid, in screenshot order.
 * `show` mirrors exactly what the old plain-list `ManagementScreen` checked
 * per area — this redesign changes presentation and adds real counts, not
 * who can see what.
 */

/**
 * Organization sections are TYPE-SCOPED for supervisors on the server
 * (`canForOrganizationType`): ADMIN and role-held reads (MODERATOR) see every
 * type; a system supervisor only the types of their own sections.
 */
const orgSection =
  (domain: 'CLINIC' | 'FARMS' | 'SYNDICATE') =>
  (c: Capabilities): boolean =>
    c.isAdmin ||
    (c.isModerator && c.can('organization.admin.read')) ||
    c.supervisorDomains.includes(domain);

export const DASHBOARD_CARD_DEFS: DashboardCardDef[] = [
  {
    id: 'poultry',
    icon: 'egg-outline',
    tint: dashboardTint(0),
    route: { pathname: Routes.adminFarms, params: { species: 'POULTRY' } },
    show: orgSection('FARMS'),
  },
  {
    // "سوق الدواجن" — traders, ad moderation, exchange-rate boards.
    id: 'poultryMarket',
    icon: 'storefront-outline',
    tint: dashboardTint(1),
    route: Routes.adminPoultryMarketHub,
    show: (c) =>
      c.isAdmin ||
      c.isSupervisorOf('MARKET') ||
      c.can('trader.admin.read') ||
      c.can('market.offer.admin.read'),
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
    show: orgSection('CLINIC'),
  },
  {
    id: 'offices',
    icon: 'business-outline',
    tint: dashboardTint(7),
    route: { pathname: Routes.adminOrganizations, params: { type: 'VETERINARY_OFFICE' } },
    show: orgSection('CLINIC'),
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
    show: orgSection('FARMS'),
  },
  {
    // "الدورات والندوات" — one unified section (Courses / Seminars tabs inside).
    id: 'courses',
    icon: 'school-outline',
    tint: dashboardTint(3),
    route: Routes.adminVetCourses,
    mergedIds: ['courses', 'seminars'],
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
    id: 'books',
    icon: 'book-outline',
    tint: dashboardTint(1),
    route: Routes.adminVeterinaryContent('BOOK'),
    show: (c) => c.isAdmin || c.isSupervisorOf('CONTENT') || c.can('content.read'),
  },
  {
    id: 'magazines',
    icon: 'newspaper-outline',
    tint: dashboardTint(4),
    route: Routes.adminVeterinaryContent('MAGAZINE'),
    show: (c) => c.isAdmin || c.isSupervisorOf('CONTENT') || c.can('content.read'),
  },
  {
    id: 'adoption',
    icon: 'heart-outline',
    tint: dashboardTint(5),
    route: { pathname: Routes.adminAnimalPublications, params: { kind: 'ADOPTION' } },
    show: (c) => c.isAdmin || c.isSupervisorOf('ANIMAL') || c.can('animal.read'),
  },
  {
    id: 'mating',
    icon: 'git-merge-outline',
    tint: dashboardTint(6),
    route: { pathname: Routes.adminAnimalPublications, params: { kind: 'MATING' } },
    show: (c) => c.isAdmin || c.isSupervisorOf('ANIMAL') || c.can('animal.read'),
  },
  {
    id: 'lostAnimals',
    icon: 'search-outline',
    tint: dashboardTint(3),
    route: { pathname: Routes.adminAnimalPublications, params: { kind: 'LOST' } },
    show: (c) => c.isAdmin || c.isSupervisorOf('ANIMAL') || c.can('animal.read'),
  },
  {
    id: 'syndicate',
    icon: 'ribbon-outline',
    tint: dashboardTint(0),
    route: { pathname: Routes.adminOrganizations, params: { type: 'SYNDICATE' } },
    show: orgSection('SYNDICATE'),
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
