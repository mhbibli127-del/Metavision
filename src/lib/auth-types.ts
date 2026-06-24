export type UserSession = {
  firstName: string;
  lastName: string;
  phone: string;
  role?: import("@/lib/platform-roles").PlatformRole;
};

export type SessionPayload = UserSession & {
  exp: number;
};

export type PendingPayload = UserSession & {
  otpHash: string;
  passwordHash?: string;
  exp: number;
};

export type AdminSessionPayload = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  exp: number;
};
