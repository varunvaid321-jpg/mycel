import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // Get all fruit entries with linked entries
  const fruits = await prisma.entry.findMany({
    where: {
      category: "fruit",
      archived: false,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Collect ALL linked IDs across all fruits (single query instead of N+1)
  const allLinkedIds = new Set<string>();
  for (const fruit of fruits) {
    if (fruit.linkedEntryIds) {
      for (const id of fruit.linkedEntryIds.split(",").filter(Boolean)) {
        allLinkedIds.add(id);
      }
    }
  }

  // Single batch query for all linked entries
  const linkedEntriesMap = new Map<string, { id: string; content: string; category: string; localDate: string; localTime: string }>();
  if (allLinkedIds.size > 0) {
    const linkedEntries = await prisma.entry.findMany({
      where: { id: { in: Array.from(allLinkedIds) } },
      select: { id: true, content: true, category: true, localDate: true, localTime: true },
    });
    for (const entry of linkedEntries) {
      linkedEntriesMap.set(entry.id, entry);
    }
  }

  // Assemble decisions from the map
  const decisions = fruits.map((fruit) => {
    const linkedIds = fruit.linkedEntryIds
      ? fruit.linkedEntryIds.split(",").filter(Boolean)
      : [];

    const linkedEntries = linkedIds
      .map((id) => linkedEntriesMap.get(id))
      .filter(Boolean);

    return {
      id: fruit.id,
      content: fruit.content,
      localDate: fruit.localDate,
      localTime: fruit.localTime,
      createdAt: fruit.createdAt,
      linkedEntries,
    };
  });

  return NextResponse.json({ decisions });
}
