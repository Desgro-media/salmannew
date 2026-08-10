import { cookies } from "next/headers";
import {
  verifyCustomerSessionToken,
  CUSTOMER_SESSION_COOKIE_NAME,
  type CustomerSession,
} from "./customer-auth";

/**
 * Reads the signed-in customer from the request cookies. proxy.ts only guards
 * /admin and /api/admin, so every customer-facing route that needs an identity
 * must call this itself rather than assuming middleware ran.
 */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  return token ? verifyCustomerSessionToken(token) : null;
}
