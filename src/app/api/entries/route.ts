import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classify } from "@/lib/classifier";
import { autoCorrect } from "@/lib/ai";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const topic = searchParams.get("topic");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = { archived: false };

  if (category && category !== "all") {
    where.category = category;
  }

  // For search, we'll filter after fetch since SQLite doesn't support case-insensitive contains
  let searchTerm = search?.toLowerCase() || "";

  // Topic filtering via tags field (comma-separated)
  if (topic && topic !== "all") {
    where.tags = { contains: topic };
  }

  if (searchTerm) {
    // Fetch more entries and filter in-memory for case-insensitive search
    const allEntries = await prisma.entry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const filtered = allEntries.filter(
      (e) =>
        e.content.toLowerCase().includes(searchTerm) ||
        e.tags.toLowerCase().includes(searchTerm) ||
        e.category.toLowerCase().includes(searchTerm)
    );

    return NextResponse.json({
      entries: filtered.slice(offset, offset + limit),
      total: filtered.length,
      searchTerm: search,
    });
  }

  const [entries, total] = await Promise.all([
    prisma.entry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.entry.count({ where }),
  ]);

  return NextResponse.json({ entries, total });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { content, localDate, localTime } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  // Auto-correct typos and bad grammar
  const corrected = await autoCorrect(content.trim());

  // Auto-classify (on corrected text for better accuracy)
  const { category, topics } = classify(corrected);

  // Auto-link: if fruit, find related recent spores/signals by keyword overlap
  let linkedEntryIds = "";
  if (category === "fruit") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 14);
    const recent = await prisma.entry.findMany({
      where: {
        category: { in: ["spore", "signal"] },
        createdAt: { gte: weekAgo },
        archived: false,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const contentWords = new Set(
      corrected
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .split(/\s+/)
        .filter((w: string) => w.length > 4)
    );

    const linked = recent.filter((r) => {
      const rWords = r.content
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .split(/\s+/)
        .filter((w: string) => w.length > 4);
      const overlap = rWords.filter((w: string) => contentWords.has(w));
      return overlap.length >= 2;
    });

    if (linked.length > 0) {
      linkedEntryIds = linked
        .slice(0, 5)
        .map((l) => l.id)
        .join(",");
    }
  }

  const entry = await prisma.entry.create({
    data: {
      content: corrected,
      category,
      tags: topics.join(","),
      localDate,
      localTime,
      linkedEntryIds,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
