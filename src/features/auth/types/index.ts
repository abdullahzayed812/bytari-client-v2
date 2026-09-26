/**
 * Auth + identity contract. Mirrors the backend `server/src/modules/auth`
 * (`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout*`,
 * `/auth/me`) and OpenAPI `phase2` schemas — verified against the real
 * implementation, not assumed.
 */

// --- enums (exact backend values) ---------------------------------------
/**
 * `PENDING_VERIFICATION` — a self-registered account whose email is not
 * confirmed yet. `AuthRedirector` treats it as its own `AuthStatus`
 * (`'pending-verification'`), distinct from both `authenticated` and
 * `unauthenticated` — see that type below.
 */
export type UserStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'DEACTIVATED';

/** Backend `veterinarian_status` — `NOT_APPLIED` is the "never applied" state. */
export type VeterinarianStatus = 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Which self-registration path created the account. `VETERINARIAN` signups skip
 * email verification but are gated by admin approval instead.
 */
export type RegistrationType = 'PET_OWNER' | 'VETERINARIAN';

/**
 * Backend `accessStateFor(user)` — the server-enforced onboarding gate.
 * Anything but `FULL` may only use the onboarding allowlist (`/auth/me`,
 * logout, avatar, veterinarian documents/apply/status).
 */
export type AccessState = 'FULL' | 'EMAIL_VERIFICATION_REQUIRED' | 'VETERINARIAN_APPROVAL_REQUIRED';

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
  | 'VETERINARIAN_STORE'
  | 'VET_JOBS'
  | 'VET_COURSES'
  | 'ADVERTISEMENT';

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
  /** ISO-3166 alpha-2 — absent on older payloads. */
  country?: string | null;
  governorate?: string | null;
  /** Optional veterinarian specialization ("التخصص"). */
  specialization?: string | null;
  gender?: Gender | null;
  /** Resolved avatar URL (never the storage key). */
  avatarUrl?: string | null;
  status: UserStatus;
  veterinarianStatus: VeterinarianStatus;
  traderStatus: TraderStatus;
  /** Absent on responses from a pre-`registration_type` backend — treat as `PET_OWNER`. */
  registrationType?: RegistrationType;
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
  /** Required by the backend for self-registration. */
  phone: string;
  /** Optional — added for the Pet Owner / Veterinarian registration screens. */
  gender?: Gender;
  /** 2-letter ISO-3166 alpha-2, uppercase. */
  country?: string;
  /** Governorate within `country` — required by the backend once a country is sent. */
  governorate?: string;
  /** Optional veterinarian specialization; ignored for Pet Owners. */
  specialization?: string;
  /** `PET_OWNER` (default) → email verification; `VETERINARIAN` → admin approval, no email code. */
  accountType?: RegistrationType;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailInput {
  email: string;
  code: string;
}

/**
 * `POST /auth/register` (201) — carries a real `{ user, tokens }` session
 * (see `AuthService.register`'s backend doc comment for exactly why), PLUS
 * `codeExpiresInSeconds` for the verify screen's countdown. `POST
 * /auth/login` (200, only for an already-ACTIVE account) and `POST
 * /auth/verify-email` (200) both return the plain `AuthResult` shape.
 */
export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResult extends AuthResult {
  /** `null` for a VETERINARIAN registration — no code is emailed. */
  codeExpiresInSeconds: number | null;
}

/** `POST /auth/resend-verification` (200) — always this shape, even for an unknown/already-verified email (anti-enumeration). */
export interface ResendVerificationResult {
  codeExpiresInSeconds: number;
  resendAvailableInSeconds: number;
}

/** `POST /auth/forgot-password` (200) — same shape for an unknown email (anti-enumeration). */
export interface PasswordResetRequestResult {
  codeExpiresInSeconds: number;
  resendAvailableInSeconds: number;
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

export interface ResetPasswordResult {
  success: boolean;
  revokedSessions: number;
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
  /** Server-computed onboarding gate. Absent on an older backend — derive from `user.status`. */
  accessState?: AccessState;
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
/**
 * Explicit lifecycle — `bootstrapping` prevents the login/app flicker
 * (§8/§21).
 *
 * `pending-verification`: the session's `user.status` is
 * `PENDING_VERIFICATION` — a registration-time token is held (it works for a
 * small self-service allowlist: avatar upload, veterinarian documents +
 * apply, `/auth/me`, refresh) but this is DELIBERATELY NOT `authenticated` —
 * `AuthRedirector` routes here to the verify-email screen instead of the main
 * app, and every other protected call the app might otherwise make is
 * refused server-side anyway (401 `EMAIL_VERIFICATION_REQUIRED`).
 */
export type AuthStatus =
  | 'bootstrapping'
  | 'authenticated'
  | 'pending-verification'
  /**
   * A VETERINARIAN-registered account whose application is not APPROVED yet
   * (not submitted / PENDING / REJECTED). The session is valid, but the server
   * refuses every non-allowlisted call (403 `VETERINARIAN_ACCOUNT_PENDING_APPROVAL`);
   * `AuthRedirector` confines the UI to the pending-approval screen.
   */
  | 'pending-approval'
  | 'unauthenticated';
