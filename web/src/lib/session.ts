import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY =
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  "denpointment_secret_key_change_in_production_min32chars!";
const key = new TextEncoder().encode(SECRET_KEY);

export const SESSION_COOKIE_NAME = "denpointment_session";

export type SessionPayload = {
  personId: number;
  email: string;
  name: string;
  role?: string;
};

/** Sign a JWT token valid for 7 days */
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

/** Verify and decode a JWT session token */
export async function decrypt(
  token: string | undefined = ""
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Create an HTTP-only session cookie */
export async function createSession(payload: SessionPayload) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

/** Read the current session from cookies in Server Components or Actions */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decrypt(token);
}

/** Delete the session cookie */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export type ResetTokenPayload = {
  personId: number;
  email: string;
  purpose: "password_reset";
};

/** Sign a password reset token valid for 1 hour */
export async function createPasswordResetToken(
  email: string,
  personId: number
): Promise<string> {
  const payload: ResetTokenPayload = {
    personId,
    email,
    purpose: "password_reset",
  };
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
}

/** Verify a password reset token */
export async function verifyPasswordResetToken(
  token: string
): Promise<ResetTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    const parsed = payload as unknown as ResetTokenPayload;
    if (parsed.purpose !== "password_reset" || !parsed.personId || !parsed.email) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

