import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  verifyPassword,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const { email, password } = parsed.data;
  const admin = await prisma.admin.findUnique({ where: { email } });

  // This portal is delivery-only — an ADMIN/SUPERADMIN account authenticating
  // here would otherwise get a valid DELIVERY-shaped session for the wrong
  // person, since role isn't part of the login credentials themselves.
  if (
    !admin ||
    admin.role !== "DELIVERY" ||
    !(await verifyPassword(password, admin.passwordHash))
  ) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  let token: string;
  try {
    token = await createSessionToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });
  } catch (err) {
    console.error("Failed to create delivery session token:", err);
    return NextResponse.json(
      { error: "Server misconfiguration — session signing failed." },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ email: admin.email, role: admin.role });
}
