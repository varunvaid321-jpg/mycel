import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, type Category } from "@/lib/categories";

export async function GET() {
  // Get entries from last 7 days
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

  // Find signals (reminders)
  const reminders = entries
    .filter((e) => e.category === "signal")
    .slice(0, 5)
    .map((e) => e.content.slice(0, 120));

  // Find fruits (actions)
  const actions = entries
    .filter((e) => e.category === "fruit")
    .slice(0, 5)
    .map((e) => e.content.slice(0, 120));

  // Find decompose items
  const letting_go = entries
    .filter((e) => e.category === "decompose")
    .slice(0, 3)
    .map((e) => e.content.slice(0, 120));

  // Simple word frequency for themes (exclude common words)
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

  // Most active category
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
  });
}
