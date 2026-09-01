/**
 * Users feature — Mobile Phase 12. A thin read-only resolver for the
 * authenticated user directory (`GET /users/:id`): turn the actor / authorship
 * user ids that other DTOs carry into a display name, and back the ownership
 * transfer recipient field. No profile editing, no directory listing — those
 * endpoints do not exist.
 */
export { usersApi, userKeys, type UsersApi, type UserSummary } from './api';
export { useUserSummary } from './hooks';
export { UserName, type UserNameProps } from './components';
