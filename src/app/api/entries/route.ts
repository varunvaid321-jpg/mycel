import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classify } from "@/lib/classifier";

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

  if (search) {
    where.content = { contains: search };
  }

  // Topic filtering via tags field (comma-separated)
  if (topic && topic !== "all") {
    where.tags = { contains: topic };
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

  // Auto-classify
  const { category, topics } = classify(content.trim());

  const entry = await prisma.entry.create({
    data: {
      content: content.trim(),
      category,
      tags: topics.join(","),
      localDate,
      localTime,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
