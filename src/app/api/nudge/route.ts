import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "have", "has",
    "had", "do", "does", "did", "will", "would", "could", "should", "may",
    "might", "can", "need", "to", "of", "in", "for", "on", "with", "at", "by",
    "from", "and", "but", "or", "not", "so", "yet", "that", "this", "it", "i",
    "my", "me", "we", "you", "they", "them", "what", "which", "who", "when",
    "where", "why", "how", "if", "about", "just", "really", "think", "like",
    "get", "got", "make", "know", "want", "been", "being", "into", "than",
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));
}

export async function GET() {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get recent signals (24-48h)
  const signals = await prisma.entry.findMany({
    where: {
      category: "signal",
      createdAt: { gte: twoDaysAgo },
      archived: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (signals.length === 0) {
    return NextResponse.json({ nudge: null });
  }

  // Check if any fruit entries reference similar topics
  const fruits = await prisma.entry.findMany({
    where: {
      category: "fruit",
      createdAt: { gte: oneDayAgo },
      archived: false,
    },
  });

  const fruitKeywords = new Set(fruits.flatMap((f) => extractKeywords(f.content)));

  // Find unresolved signals (no matching fruit)
  const unresolved = signals.filter((s) => {
    const signalKws = extractKeywords(s.content);
    const overlap = signalKws.filter((kw) => fruitKeywords.has(kw));
    return overlap.length === 0;
  });

  if (unresolved.length === 0) {
    return NextResponse.json({ nudge: null });
  }

  // Pick the most recent unresolved signal
  const top = unresolved[0];
  const snippet = top.content.slice(0, 80);
  const nudge = `You noted: "${snippet}${top.content.length > 80 ? "..." : ""}" — have you acted on this?`;

  return NextResponse.json({ nudge, signalId: top.id });
}
