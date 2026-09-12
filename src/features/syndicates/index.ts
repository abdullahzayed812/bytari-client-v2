/**
 * Veterinary Syndicates / Unions ("نقابة الأطباء البيطريين"). A syndicate is
 * a platform `organizations` row (`type = 'SYNDICATE'`) — reusing the
 * existing organization-scoped membership/supervisor RBAC
 * (`AuthorizationService.canInOrganization`) and follow feature as-is. Only
 * its profile fields, announcements and requests/inquiries ("submissions")
 * are new. Backend enforces every scoping rule
 * (`server/src/modules/syndicates`) — a subordinate-syndicate supervisor can
 * never manage another syndicate's data.
 */
export {
  syndicatesApi,
  adminSyndicatesApi,
  syndicateKeys,
  type SyndicatesApi,
  type AdminSyndicatesApi,
  type SyndicateMediaKind,
} from './api';
export * from './hooks';
export * from './components';
export * from './screens';
export * from './types';
