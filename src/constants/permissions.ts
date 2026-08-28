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
  USER_STATUS_MANAGE: 'user.status.manage',
  // roles / permissions
  ROLE_READ: 'role.read',
  ROLE_ASSIGN: 'role.assign',
  PERMISSION_READ: 'permission.read',
  PERMISSION_ASSIGN: 'permission.assign',
  // veterinarian approval
  VETERINARIAN_APPLICATION_READ: 'veterinarian.application.read',
  VETERINARIAN_APPLICATION_DECIDE: 'veterinarian.application.decide',
  // supervisors
  SUPERVISOR_READ: 'supervisor.read',
  SUPERVISOR_ASSIGN: 'supervisor.assign',
  // audit
  AUDIT_READ: 'audit.read',
  // organizations (admin surface)
  ORGANIZATION_ADMIN_READ: 'organization.admin.read',
  ORGANIZATION_ADMIN_DECIDE: 'organization.admin.decide',
  // notifications (admin broadcast)
  NOTIFICATION_ADMIN_SEND: 'notification.admin.send',
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission] | (string & {});
