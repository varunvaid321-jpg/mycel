import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, type Category } from "@/lib/categories";
import { generateWeeklyBrief, type AIWeeklyBrief } from "@/lib/ai";

export const dynamic = "force-dynamic";

// Server-side cache: avoid re-calling AI on every request.
// Stores the last AI brief + the entry count it was based on.
// Re-generates only when entry count changes (new entry planted).
let cachedBrief: AIWeeklyBrief | null = null;
let cachedEntryCount = -1;
let cachedAt = 0;
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes max staleness

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

  // AI brief: use cache if entry count unchanged and not too stale
  const now = Date.now();
  const cacheValid =
    cachedBrief &&
    cachedEntryCount === entries.length &&
    now - cachedAt < CACHE_MAX_AGE_MS;

  let aiBrief: AIWeeklyBrief | null;
  if (cacheValid) {
    aiBrief = cachedBrief;
    console.log(`[weekly] cache HIT — ${entries.length} entries, age ${Math.round((now - cachedAt) / 1000)}s`);
  } else {
    console.log(`[weekly] cache MISS — entries: ${entries.length} (was ${cachedEntryCount}), age: ${cachedAt ? Math.round((now - cachedAt) / 1000) + "s" : "never"}`);
    aiBrief = await generateWeeklyBrief(entries);
    if (aiBrief) {
      cachedBrief = aiBrief;
      cachedEntryCount = entries.length;
      cachedAt = now;
    }
  }

  // Fallback rule-based data (always computed — cheap)
  const reminders = entries
    .filter((e) => e.category === "signal")
    .slice(0, 5)
    .map((e) => e.content);

  const actions = entries
    .filter((e) => e.category === "fruit")
    .slice(0, 5)
    .map((e) => e.content);

  const letting_go = entries
    .filter((e) => e.category === "decompose")
    .slice(0, 3)
    .map((e) => e.content);

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
  });
}
