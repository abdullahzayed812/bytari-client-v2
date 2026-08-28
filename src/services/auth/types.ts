/** Auth contract — mirrors the backend `src/modules/auth` + `GET /auth/me`. */

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type VeterinarianStatus = 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type RoleKey = 'ADMIN' | 'MODERATOR' | 'PET_OWNER' | 'VETERINARIAN';
export type SupervisorDomain =
  'ANIMAL' | 'CLINIC' | 'STORE' | 'CONTENT' | 'CONSULTATION' | 'INQUIRY';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  veterinarianStatus: VeterinarianStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** Access-token lifetime in seconds. */
  expiresIn: number;
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

/** Response of `GET /auth/me` — the authoritative capability snapshot. */
export interface SessionSnapshot {
  user: AuthUser;
  roles: RoleKey[];
  permissions: string[];
  isAdmin: boolean;
  supervisorDomains: SupervisorDomain[];
  veterinarian: {
    status: VeterinarianStatus;
    approved: boolean;
  };
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}
