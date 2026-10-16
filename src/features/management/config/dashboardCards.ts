import type { Href } from 'expo-router';

import type { IconName } from '@/components/content';
import { Routes } from '@/constants/routes';
import type { AdminDashboardCardId } from '@/features/admin/types';
import type { Capabilities } from '@/hooks/useCapabilities';

import {
  dashboardTint,
  type DashboardPalette,
  type DashboardTint,
} from '../components/AdminDashboardCard';

export interface DashboardCardDef {
  id: AdminDashboardCardId;
  icon: IconName;
  /** Light-theme card colours, verbatim from the dashboard reference design. */
  palette: DashboardPalette;
  /** Dark-theme fallback (theme tokens). */
  tint: DashboardTint;
  route: Href;
  /**
   * Server card ids whose counters this ONE tile aggregates (and marks seen
   * when opened). Used for "الدورات والندوات" and "التبني والتزاوج والحيوانات
   * المفقودة" — the server keeps separate counters, the dashboard shows one
   * unified section.
   */
  mergedIds?: AdminDashboardCardId[];
  /** Same RBAC gating the pre-redesign `ManagementScreen` used per area — unchanged, only the presentation changed. */
  show: (caps: Capabilities) => boolean;
}

/**
 * Every card in the admin dashboard grid, in the order (and with the icon /
 * colours) of the `لوحة التحكم.html` reference.
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
    id: 'pets',
    icon: 'heart-outline',
    tint: dashboardTint(2),
    palette: { bg: '#f2efff', border: '#e4ddff', accent: '#7c5cfc' },
    route: Routes.adminAnimals,
    show: (c) => c.isAdmin || c.isSupervisorOf('ANIMAL') || c.can('animal.read'),
  },
  {
    // "سوق الدواجن" — traders, ad moderation, exchange-rate boards.
    id: 'poultryMarket',
    icon: 'business-outline',
    tint: dashboardTint(1),
    palette: { bg: '#feeef3', border: '#fdd7e2', accent: '#f43f80' },
    route: Routes.adminPoultryMarketHub,
    show: (c) =>
      c.isAdmin ||
      c.isSupervisorOf('MARKET') ||
      c.can('trader.admin.read') ||
      c.can('market.offer.admin.read'),
  },
  {
    id: 'poultry',
    icon: 'person-outline',
    tint: dashboardTint(0),
    palette: { bg: '#fff8eb', border: '#fee6c2', accent: '#f59e0b' },
    route: { pathname: Routes.adminFarms, params: { species: 'POULTRY' } },
    show: orgSection('FARMS'),
  },
  {
    id: 'ads',
    icon: 'megaphone-outline',
    tint: dashboardTint(4),
    palette: { bg: '#fff1ec', border: '#fddbcf', accent: '#ff5a36' },
    route: Routes.adminAds,
    show: (c) => c.isAdmin || c.isSupervisorOf('ADVERTISEMENT') || c.can('advertisement.manage'),
  },
  {
    id: 'inquiries',
    icon: 'help-circle-outline',
    tint: dashboardTint(3),
    palette: { bg: '#f2efff', border: '#e4ddff', accent: '#8261fc' },
    route: Routes.supportManage('inquiries'),
    show: (c) => c.isAdmin || c.isSupervisorOf('INQUIRY') || c.can('inquiry.admin.read'),
  },
  {
    id: 'consultations',
    icon: 'chatbubble-ellipses-outline',
    tint: dashboardTint(5),
    palette: { bg: '#edfdf6', border: '#d2f7e7', accent: '#10b981' },
    route: Routes.supportManage('consultations'),
    show: (c) => c.isAdmin || c.isSupervisorOf('CONSULTATION') || c.can('consultation.admin.read'),
  },
  {
    id: 'vetApprovals',
    icon: 'people-outline',
    tint: dashboardTint(2),
    palette: { bg: '#fff8eb', border: '#fedfb2', accent: '#fba818' },
    route: Routes.adminVetApplications,
    show: (c) => c.isAdmin || c.can('veterinarian.read'),
  },
  {
    id: 'offices',
    icon: 'business-outline',
    tint: dashboardTint(7),
    palette: { bg: '#feeff3', border: '#fddbe5', accent: '#f43f80' },
    route: { pathname: Routes.adminOrganizations, params: { type: 'VETERINARY_OFFICE' } },
    show: orgSection('CLINIC'),
  },
  {
    id: 'clinics',
    icon: 'albums-outline',
    tint: dashboardTint(1),
    palette: { bg: '#edfdf6', border: '#d2f7e7', accent: '#10b981' },
    route: { pathname: Routes.adminOrganizations, params: { type: 'CLINIC' } },
    show: orgSection('CLINIC'),
  },
  {
    id: 'services',
    icon: 'home-outline',
    tint: dashboardTint(5),
    palette: { bg: '#fff2ec', border: '#fedecf', accent: '#f97316' },
    route: Routes.adminServicesHub,
    show: (c) => c.isAdmin || c.isSupervisorOf('VET_SERVICE') || c.can('vet_service.read'),
  },
  {
    // "الدورات والندوات" — one unified section (Courses / Seminars tabs inside).
    id: 'courses',
    icon: 'school-outline',
    tint: dashboardTint(3),
    palette: { bg: '#eef7ff', border: '#d2ebff', accent: '#3b82f6' },
    route: Routes.adminVetCourses,
    mergedIds: ['courses', 'seminars'],
    show: (c) => c.isAdmin || c.isSupervisorOf('VET_COURSES') || c.can('vet_course.read'),
  },
  {
    id: 'livestock',
    icon: 'book-outline',
    tint: dashboardTint(3),
    palette: { bg: '#ebf7ff', border: '#d2edff', accent: '#0284c7' },
    route: { pathname: Routes.adminFarms, params: { species: 'LIVESTOCK' } },
    show: orgSection('FARMS'),
  },
  {
    id: 'syndicate',
    icon: 'person-outline',
    tint: dashboardTint(0),
    palette: { bg: '#fff8eb', border: '#fedfb2', accent: '#fba818' },
    route: { pathname: Routes.adminOrganizations, params: { type: 'SYNDICATE' } },
    show: orgSection('SYNDICATE'),
  },
  {
    // "التبني والتزاوج والحيوانات المفقودة" — ONE section with Adoption / Mating /
    // Lost tabs; the server keeps separate per-kind counters, summed here.
    id: 'adoption',
    icon: 'cube-outline',
    tint: dashboardTint(5),
    palette: { bg: '#fff3ec', border: '#fedecf', accent: '#f97316' },
    route: Routes.adminAnimalPublications,
    mergedIds: ['adoption', 'mating', 'lostAnimals'],
    show: (c) => c.isAdmin || c.isSupervisorOf('ANIMAL') || c.can('animal.read'),
  },
  {
    // "الكتب والمجلات" — ONE section with Books / Magazines tabs. The server's
    // `content` counter already sums both types.
    id: 'content',
    icon: 'book-outline',
    tint: dashboardTint(2),
    palette: { bg: '#f2efff', border: '#e3dcff', accent: '#7c5cfc' },
    route: Routes.adminContentHub,
    show: (c) => c.isAdmin || c.isSupervisorOf('CONTENT') || c.can('content.read'),
  },
  {
    id: 'chats',
    icon: 'chatbox-ellipses-outline',
    tint: dashboardTint(6),
    palette: { bg: '#f2efff', border: '#e4ddff', accent: '#8261fc' },
    route: Routes.adminChats,
    show: (c) => c.isAdmin || c.can('chat.read'),
  },
  {
    id: 'veterinarians',
    icon: 'person-outline',
    tint: dashboardTint(4),
    palette: { bg: '#ebf5ff', border: '#d2e7ff', accent: '#3b82f6' },
    route: { pathname: Routes.adminUsers, params: { accountType: 'VETERINARIAN' } },
    show: (c) => c.isAdmin || c.can('user.read'),
  },
  {
    id: 'petOwners',
    icon: 'people-outline',
    tint: dashboardTint(1),
    palette: { bg: '#feeff3', border: '#fddbe5', accent: '#f43f80' },
    route: { pathname: Routes.adminUsers, params: { accountType: 'PET_OWNER' } },
    show: (c) => c.isAdmin || c.can('user.read'),
  },
  {
    id: 'petOwnerStore',
    icon: 'bag-handle-outline',
    tint: dashboardTint(5),
    palette: { bg: '#edfdf6', border: '#d2f7e7', accent: '#10b981' },
    route: Routes.adminPetOwnerStoreHub,
    show: (c) =>
      c.isAdmin || c.isSupervisorOf('PET_OWNER_STORE') || c.can('pet_store.product.manage'),
  },
  {
    id: 'supervisors',
    icon: 'shield-checkmark-outline',
    tint: dashboardTint(2),
    palette: { bg: '#fff2ec', border: '#fedecf', accent: '#f97316' },
    route: Routes.adminSupervisors,
    show: (c) => c.isAdmin || c.can('supervisor.read'),
  },
  {
    id: 'jobs',
    icon: 'briefcase-outline',
    tint: dashboardTint(4),
    palette: { bg: '#feeff3', border: '#fddbe5', accent: '#f43f80' },
    route: Routes.adminJobsHub,
    show: (c) => c.isAdmin || c.isSupervisorOf('VET_JOBS') || c.can('vet_job.read'),
  },
  {
    id: 'userMessages',
    icon: 'mail-outline',
    tint: dashboardTint(0),
    palette: { bg: '#fff9eb', border: '#fde5b7', accent: '#fba818' },
    route: Routes.supportManage('support-messages'),
    show: (c) => c.isAdmin || c.isSupervisorOf('SUPPORT') || c.can('support.admin.read'),
  },
  {
    id: 'users',
    icon: 'settings-outline',
    tint: dashboardTint(7),
    palette: { bg: '#eff3f6', border: '#dce4ea', accent: '#64748b' },
    route: Routes.adminUsers,
    show: (c) => c.isAdmin || c.can('user.read'),
  },
  {
    id: 'veterinarianStore',
    icon: 'bag-handle-outline',
    tint: dashboardTint(6),
    palette: { bg: '#edfdf6', border: '#d2f7e7', accent: '#10b981' },
    route: Routes.adminVeterinarianStoreHub,
    show: (c) =>
      c.isAdmin ||
      c.isSupervisorOf('VETERINARIAN_STORE') ||
      c.can('veterinarian_store.product.manage'),
  },
  {
    // "صور أقسام الصفحة الرئيسية" — images for the existing home-page section cards.
    id: 'homeSections',
    icon: 'image-outline',
    tint: dashboardTint(6),
    palette: { bg: '#eaf4ff', border: '#d0e5fc', accent: '#3b82f6' },
    route: Routes.adminHomeSections,
    show: (c) => c.isAdmin || c.can('home_section.manage'),
  },
  {
    id: 'broadcasts',
    icon: 'navigate-outline',
    tint: dashboardTint(3),
    palette: { bg: '#edfdf6', border: '#d2f7e7', accent: '#10b981' },
    route: Routes.adminBroadcast,
    show: (c) => c.isAdmin || c.can('notification.admin.send'),
  },
];
