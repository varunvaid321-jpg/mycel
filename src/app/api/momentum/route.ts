import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOPICS, type Topic } from "@/lib/classifier";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const entries = await prisma.entry.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      archived: false,
    },
    orderBy: { createdAt: "asc" },
  });

  const topicKeys = Object.keys(TOPICS) as Topic[];

  // Build 30-day grid: for each day, count entries per topic
  const days: { date: string; topics: Record<string, number> }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const topicCounts: Record<string, number> = {};
    for (const t of topicKeys) {
      topicCounts[t] = 0;
    }
    days.push({ date: dateStr, topics: topicCounts });
  }

  for (const entry of entries) {
    const dateStr = entry.createdAt.toISOString().slice(0, 10);
    const day = days.find((d) => d.date === dateStr);
    if (!day) continue;

    const tags = entry.tags ? entry.tags.split(",").filter(Boolean) : [];
    for (const tag of tags) {
      if (tag in day.topics) {
        day.topics[tag]++;
      }
    }
  }

  return NextResponse.json({
    days,
    topics: topicKeys.map((k) => ({ key: k, label: TOPICS[k].label })),
  });
}
