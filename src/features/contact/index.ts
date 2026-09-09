/**
 * "تواصل معنا" — the Contact page: published contact channels + a message to the
 * administration. The message form creates a SUPPORT thread (see
 * `@/features/support`, kind `SUPPORT`) — no recipient; the backend routes it to
 * ADMIN / a SUPPORT system-supervisor. The reply thread reuses the shared
 * support thread screen (`Routes.supportThread('support-messages', id)`).
 */
export { ContactUsScreen } from './screens';
export { CONTACT_INFO } from './constants';
