import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/account-schema";
import {
  createCustomerSessionToken,
  hashPassword,
  CUSTOMER_SESSION_COOKIE_NAME,
  CUSTOMER_SESSION_COOKIE_MAX_AGE,
} from "@/lib/customer-auth";

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = signupSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid signup details." },
      { status: 400 },
    );
  }

  const { email, password, fullName } = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const customer = await prisma.customer.create({
    data: { email, passwordHash, fullName },
  });

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

  return NextResponse.json({ email: customer.email, fullName: customer.fullName }, { status: 201 });
}
