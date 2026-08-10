import { SignJWT, jwtVerify } from "jose";
import { getSecretKey, hashPassword, verifyPassword } from "./auth";

export { hashPassword, verifyPassword };

export const CUSTOMER_SESSION_COOKIE_NAME = "sp_customer_session";
const CUSTOMER_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface CustomerSession {
  sub: string; // Customer.id
  email: string;
  fullName: string;
}

export async function createCustomerSessionToken(session: CustomerSession): Promise<string> {
  return new SignJWT({ email: session.email, fullName: session.fullName })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${CUSTOMER_SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyCustomerSessionToken(token: string): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.fullName !== "string"
    ) {
      return null;
    }
    return { sub: payload.sub, email: payload.email, fullName: payload.fullName };
  } catch {
    return null;
  }
}

export const CUSTOMER_SESSION_COOKIE_MAX_AGE = CUSTOMER_SESSION_DURATION_SECONDS;
