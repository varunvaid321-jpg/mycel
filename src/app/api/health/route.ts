import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWeeklyHealthMonitor } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const weekEntries = await prisma.entry.findMany({
    where: { createdAt: { gte: weekAgo }, archived: false },
    orderBy: { createdAt: "desc" },
  });

  const monthEntries = await prisma.entry.findMany({
    where: { createdAt: { gte: thirtyDaysAgo }, archived: false },
    orderBy: { createdAt: "desc" },
  });

  const healthLog = await generateWeeklyHealthMonitor(weekEntries, monthEntries);
  return NextResponse.json({ healthLog });
}
