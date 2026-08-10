import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyCustomerSessionToken, CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/customer-auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyCustomerSessionToken(token) : null;

  if (!session) {
    return NextResponse.json(null);
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.sub } });
  if (!customer) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    email: customer.email,
    fullName: customer.fullName,
    phone: customer.phone ?? "",
    address: customer.address ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
    pincode: customer.pincode ?? "",
  });
}
