/**
 * Auth + identity contract. Mirrors the backend `server/src/modules/auth`
 * (`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout*`,
 * `/auth/me`) and OpenAPI `phase2` schemas — verified against the real
 * implementation, not assumed.
 */

// --- enums (exact backend values) ---------------------------------------
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

/** Backend `veterinarian_status` — `NOT_APPLIED` is the "never applied" state. */
export type VeterinarianStatus = 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';

/** Backend `trader_status` (Poultry Markets module) — per-USER, no role component. */
export type TraderStatus = 'NOT_REGISTERED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type RoleKey = 'ADMIN' | 'MODERATOR' | 'PET_OWNER' | 'VETERINARIAN';

export type SupervisorDomain =
  | 'ANIMAL'
  | 'CLINIC'
  | 'STORE'
  | 'CONTENT'
  | 'CONSULTATION'
  | 'INQUIRY'
  | 'SUPPORT'
  | 'MARKET'
  | 'PET_OWNER_STORE'
  | 'VET_SERVICE'
  | 'VETERINARIAN_STORE';

// --- user DTO ---------------------------------------------------------
/**
 * The public mobile user model. Contains ONLY fields the backend returns from
 * `/auth/*`. No password hash, no refresh token, no backend-internal columns.
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  veterinarianStatus: VeterinarianStatus;
  traderStatus: TraderStatus;
  createdAt: string;
  updatedAt: string;
}

// --- tokens ---------------------------------------------------------
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** Access-token lifetime in seconds. */
  expiresIn: number;
}

/** Backend `gender` enum accepted on registration. */
export type Gender = 'MALE' | 'FEMALE';

// --- endpoint payloads ----------------------------------------------
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  /** Optional — added for the Pet Owner / Veterinarian registration screens. */
  gender?: Gender;
  /** Optional — 2-letter ISO-3166 alpha-2, uppercase. */
  country?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** `POST /auth/register` (201) and `POST /auth/login` (200). */
export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

/** `POST /auth/refresh` (200) — **tokens only, no user**. */
export interface RefreshResult {
  tokens: AuthTokens;
}

export interface LogoutResult {
  success: boolean;
}

export interface LogoutAllResult {
  success: boolean;
  revokedSessions: number;
}

/**
 * `GET /auth/me` — the authoritative identity + capability snapshot.
 * `permissions` and `isAdmin` are the source of truth for what the user may do.
 */
export interface SessionSnapshot {
  user: User;
  roles: RoleKey[];
  permissions: string[];
  isAdmin: boolean;
  supervisorDomains: SupervisorDomain[];
  veterinarian: {
    status: VeterinarianStatus;
    approved: boolean;
  };
  trader: {
    status: TraderStatus;
    approved: boolean;
  };
}

// --- session state ------------------------------------------------
/** Explicit lifecycle — `bootstrapping` prevents the login/app flicker (§8/§21). */
export type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';
