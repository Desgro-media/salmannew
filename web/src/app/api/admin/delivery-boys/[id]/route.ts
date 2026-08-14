import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Scoped to role: DELIVERY so this endpoint can never be used to remove an
  // ADMIN/SUPERADMIN account.
  const { count } = await prisma.admin.deleteMany({ where: { id, role: "DELIVERY" } });

  if (count === 0) {
    return NextResponse.json({ error: "Delivery account not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
