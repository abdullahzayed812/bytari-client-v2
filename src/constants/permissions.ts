/**
 * Permission keys mirrored from the backend RBAC catalogue
 * (`server/src/modules/rbac/rbac.constants.ts`).
 *
 * This list exists ONLY for typo-safety and autocomplete when the UI checks a
 * capability for *display* purposes. It is NOT an authorization mechanism:
 *  - The authoritative permission set is `session.permissions` from `/auth/me`.
 *  - Hiding a button is UX, never security. The backend re-checks every action.
 *  - If this list drifts from the backend, the backend still wins.
 */
export const Permission = {
  // identity / users
  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_SUSPEND: 'user.suspend',
  USER_ACTIVATE: 'user.activate',
  USER_DEACTIVATE: 'user.deactivate',
  // roles / permissions
  ROLE_READ: 'role.read',
  ROLE_ASSIGN: 'role.assign',
  PERMISSION_READ: 'permission.read',
  PERMISSION_ASSIGN: 'permission.assign',
  // veterinarian approval
  VETERINARIAN_READ: 'veterinarian.read',
  VETERINARIAN_APPROVE: 'veterinarian.approve',
  VETERINARIAN_REJECT: 'veterinarian.reject',
  // system supervisors
  SUPERVISOR_READ: 'supervisor.read',
  SUPERVISOR_ASSIGN: 'supervisor.assign',
  SUPERVISOR_REMOVE: 'supervisor.remove',
  // audit
  AUDIT_READ: 'audit.read',
  // organizations (admin surface)
  ORGANIZATION_ADMIN_READ: 'organization.admin.read',
  ORGANIZATION_ADMIN_APPROVE: 'organization.admin.approve',
  ORGANIZATION_ADMIN_STATUS: 'organization.admin.status',
  ORGANIZATION_ADMIN_MANAGE: 'organization.admin.manage',
  // notifications (admin broadcast)
  NOTIFICATION_ADMIN_SEND: 'notification.admin.send',
  // trader registration (admin approval)
  TRADER_ADMIN_READ: 'trader.admin.read',
  TRADER_ADMIN_APPROVE: 'trader.admin.approve',
  TRADER_ADMIN_REJECT: 'trader.admin.reject',
  TRADER_ADMIN_SUSPEND: 'trader.admin.suspend',
  // poultry/egg market offers + exchange rates (admin/specialist surface)
  MARKET_OFFER_ADMIN_READ: 'market.offer.admin.read',
  MARKET_OFFER_ADMIN_DELETE: 'market.offer.admin.delete',
  MARKET_RATE_MANAGE: 'market.rate.manage',
  // Pet Owners Store — platform catalogue + order management
  PET_STORE_PRODUCT_MANAGE: 'pet_store.product.manage',
  PET_STORE_CATEGORY_MANAGE: 'pet_store.category.manage',
  PET_STORE_ORDER_MANAGE: 'pet_store.order.manage',
  // Veterinarian Store — platform catalogue + order management
  VETERINARIAN_STORE_PRODUCT_MANAGE: 'veterinarian_store.product.manage',
  VETERINARIAN_STORE_CATEGORY_MANAGE: 'veterinarian_store.category.manage',
  VETERINARIAN_STORE_ORDER_MANAGE: 'veterinarian_store.order.manage',
  // Veterinary Services marketplace — listing + request moderation
  VET_SERVICE_READ: 'vet_service.read',
  VET_SERVICE_APPROVE: 'vet_service.approve',
  VET_SERVICE_REJECT: 'vet_service.reject',
  // Veterinarian Jobs / Careers — offer + seeker-profile moderation
  VET_JOB_READ: 'vet_job.read',
  VET_JOB_APPROVE: 'vet_job.approve',
  VET_JOB_REJECT: 'vet_job.reject',
  // Veterinarian Courses & Seminars — course/seminar/workshop moderation
  VET_COURSE_READ: 'vet_course.read',
  VET_COURSE_APPROVE: 'vet_course.approve',
  VET_COURSE_REJECT: 'vet_course.reject',
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission] | (string & {});
