import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, type Category } from "@/lib/categories";
import { generateWeeklyBrief, generateHealthLog, type AIWeeklyBrief, type AIHealthLog } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Server-side cache: avoid re-calling AI on every request.
// Stores the last AI brief + the entry count it was based on.
// Re-generates only when entry count changes (new entry planted).
let cachedBrief: AIWeeklyBrief | null = null;
let cachedEntryCount = -1;
let cachedAt = 0;
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes max staleness

let cachedHealthLog: AIHealthLog | null = null;
let cachedHealthCount = -1;
let cachedHealthAt = 0;

export async function GET() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const entries = await prisma.entry.findMany({
    where: {
      createdAt: { gte: weekAgo },
      archived: false,
    },
    orderBy: { createdAt: "desc" },
  });

  // Category breakdown
  const breakdown: Record<string, number> = {};
  for (const e of entries) {
    breakdown[e.category] = (breakdown[e.category] || 0) + 1;
  }

  // Filter out imported entries for AI analysis
  const organicEntries = entries.filter((e) => !e.tags?.includes("imported"));

  // AI brief: use cache if entry count unchanged and not too stale
  const now = Date.now();
  const cacheValid =
    cachedBrief &&
    cachedEntryCount === organicEntries.length &&
    now - cachedAt < CACHE_MAX_AGE_MS;

  let aiBrief: AIWeeklyBrief | null;
  if (cacheValid) {
    aiBrief = cachedBrief;
    console.log(`[weekly] cache HIT — ${organicEntries.length} entries, age ${Math.round((now - cachedAt) / 1000)}s`);
  } else {
    console.log(`[weekly] cache MISS — entries: ${organicEntries.length} (was ${cachedEntryCount}), age: ${cachedAt ? Math.round((now - cachedAt) / 1000) + "s" : "never"}`);
    aiBrief = await generateWeeklyBrief(organicEntries);
    if (aiBrief) {
      cachedBrief = aiBrief;
      cachedEntryCount = organicEntries.length;
      cachedAt = now;
    }
  }

  // Health log: separate cache, same invalidation logic
  const healthCacheValid =
    cachedHealthLog &&
    cachedHealthCount === organicEntries.length &&
    now - cachedHealthAt < CACHE_MAX_AGE_MS;

  let healthLog: AIHealthLog | null;
  if (healthCacheValid) {
    healthLog = cachedHealthLog;
  } else {
    healthLog = await generateHealthLog(organicEntries);
    if (healthLog) {
      cachedHealthLog = healthLog;
      cachedHealthCount = organicEntries.length;
      cachedHealthAt = now;
    }
  }

  // Fallback rule-based data (always computed — cheap)
  // Deduplicate by content to avoid showing the same entry multiple times
  const uniqueContent = (items: string[], max: number) => [...new Set(items)].slice(0, max);

  const reminders = uniqueContent(
    entries.filter((e) => e.category === "signal").map((e) => e.content),
    5
  );

  const actions = uniqueContent(
    entries.filter((e) => e.category === "fruit").map((e) => e.content),
    5
  );

  const letting_go = uniqueContent(
    entries.filter((e) => e.category === "decompose").map((e) => e.content),
    3
  );

  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "and", "but", "or", "nor", "not", "so", "yet", "both", "either",
    "neither", "each", "every", "all", "any", "few", "more", "most", "other",
    "some", "such", "no", "only", "own", "same", "than", "too", "very",
    "just", "because", "about", "that", "this", "it", "its", "i", "my",
    "me", "we", "our", "you", "your", "they", "them", "their", "what",
    "which", "who", "when", "where", "why", "how", "if", "up", "don't",
    "really", "think", "like", "get", "got", "make", "know", "want",
  ]);

  const wordCounts: Record<string, number> = {};
  for (const e of entries) {
    const words = e.content.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
    for (const w of words) {
      if (w.length > 3 && !stopWords.has(w)) {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      }
    }
  }

  const themes = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word, count]) => ({ word, count }));

  const topCategory = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0];

  return NextResponse.json({
    totalEntries: entries.length,
    breakdown,
    themes,
    reminders,
    actions,
    letting_go,
    topCategory: topCategory
      ? {
          key: topCategory[0],
          label: CATEGORIES[topCategory[0] as Category]?.label || topCategory[0],
          count: topCategory[1],
        }
      : null,
    aiBrief,
    healthLog,
  });
}
