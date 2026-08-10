import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/account-schema";
import {
  createCustomerSessionToken,
  verifyPassword,
  CUSTOMER_SESSION_COOKIE_NAME,
  CUSTOMER_SESSION_COOKIE_MAX_AGE,
} from "@/lib/customer-auth";

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const { email, password } = parsed.data;
  const customer = await prisma.customer.findUnique({ where: { email } });

  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  let token: string;
  try {
    token = await createCustomerSessionToken({
      sub: customer.id,
      email: customer.email,
      fullName: customer.fullName,
    });
  } catch (err) {
    console.error("Failed to create customer session token:", err);
    return NextResponse.json(
      { error: "Server misconfiguration — session signing failed." },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ email: customer.email, fullName: customer.fullName });
}
