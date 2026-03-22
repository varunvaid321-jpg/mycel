import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TOPICS, type Topic } from "@/lib/classifier";
import { generateMonthlyReview, type AIMonthlyReview } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Server-side cache for monthly review (same pattern as weekly)
let cachedReview: AIMonthlyReview | null = null;
let cachedEntryCount = -1;
let cachedAt = 0;
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const entries = await prisma.entry.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      archived: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (entries.length === 0) {
    return NextResponse.json({ totalEntries: 0 });
  }

  // AI review: use cache if entry count unchanged and not too stale
  const nowMs = Date.now();
  const cacheValid =
    cachedReview &&
    cachedEntryCount === entries.length &&
    nowMs - cachedAt < CACHE_MAX_AGE_MS;

  let aiReview: AIMonthlyReview | null;
  if (cacheValid) {
    aiReview = cachedReview;
  } else {
    aiReview = await generateMonthlyReview(entries);
    if (aiReview) {
      cachedReview = aiReview;
      cachedEntryCount = entries.length;
      cachedAt = nowMs;
    }
  }

  // Fallback stats
  const topicCounts: Record<string, number> = {};
  for (const e of entries) {
    const tags = e.tags ? e.tags.split(",").filter(Boolean) : [];
    for (const tag of tags) {
      topicCounts[tag] = (topicCounts[tag] || 0) + 1;
    }
  }

  const topFocusAreas = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => ({
      topic: TOPICS[key as Topic]?.label || key,
      count,
    }));

  const keyDecisions = entries
    .filter((e) => e.category === "fruit")
    .slice(0, 5)
    .map((e) => e.content.slice(0, 120));

  const categoryBreakdown: Record<string, number> = {};
  for (const e of entries) {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + 1;
  }

  return NextResponse.json({
    totalEntries: entries.length,
    topFocusAreas,
    keyDecisions,
    categoryBreakdown,
    aiReview,
  });
}
