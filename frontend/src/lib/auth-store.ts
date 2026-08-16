let accessToken: string | null = null;
let user: AuthenticatedUser | null = null;

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  avatarUrl?: string | null;
  createdAt?: string | null;
  lastLoginAt?: string | null;
};

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
  user = null;
}

export function setCurrentUser(value: AuthenticatedUser): void { user = value; }
export function getCurrentUser(): AuthenticatedUser | null { return user; }
