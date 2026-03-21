import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateGuide } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  // Get entries from last 14 days for deeper context
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const entries = await prisma.entry.findMany({
    where: {
      createdAt: { gte: twoWeeksAgo },
      archived: false,
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  if (entries.length < 2) {
    return NextResponse.json({ guide: null });
  }

  const guide = await generateGuide(entries);

  // If guide says "silent", return null
  if (guide?.type === "silent") {
    return NextResponse.json({ guide: null });
  }

  return NextResponse.json({ guide });
}
