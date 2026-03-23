import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { id } = params;

  const entry = await prisma.entry.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(entry);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.entry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
