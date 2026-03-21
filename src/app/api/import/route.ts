import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classify } from "@/lib/classifier";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { memories, source } = await request.json();

  if (!memories || !Array.isArray(memories) || memories.length === 0) {
    return NextResponse.json({ error: "No memories provided" }, { status: 400 });
  }

  const now = new Date();
  const localDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Toronto",
  });
  const localTime = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  });

  const imported = [];
  const skipped = [];

  for (const memory of memories) {
    const text = (typeof memory === "string" ? memory : memory.text || memory.content || "").trim();
    if (!text || text.length < 3) {
      skipped.push(text || "(empty)");
      continue;
    }

    // Check for duplicates
    const existing = await prisma.entry.findFirst({
      where: { content: text },
    });
    if (existing) {
      skipped.push(text.slice(0, 50) + " (duplicate)");
      continue;
    }

    const { category, topics } = classify(text);

    const entry = await prisma.entry.create({
      data: {
        content: text,
        category,
        tags: [...topics, source || "imported"].join(","),
        localDate,
        localTime,
      },
    });

    imported.push({ id: entry.id, content: text.slice(0, 60), category });
  }

  return NextResponse.json({
    imported: imported.length,
    skipped: skipped.length,
    details: imported,
    skippedDetails: skipped,
  });
}
