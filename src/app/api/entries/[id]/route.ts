import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = ["content", "archived"];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { id } = params;

  // Only allow whitelisted fields
  const data: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const entry = await prisma.entry.update({
    where: { id },
    data,
  });

  return NextResponse.json(entry);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // Soft delete — archive instead of permanent delete
  await prisma.entry.update({
    where: { id: params.id },
    data: { archived: true },
  });
  return NextResponse.json({ ok: true });
}
