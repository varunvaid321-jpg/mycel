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

  const decisions = await Promise.all(
    fruits.map(async (fruit) => {
      const linkedIds = fruit.linkedEntryIds
        ? fruit.linkedEntryIds.split(",").filter(Boolean)
        : [];

      let linkedEntries: { id: string; content: string; category: string; localDate: string; localTime: string }[] = [];
      if (linkedIds.length > 0) {
        linkedEntries = await prisma.entry.findMany({
          where: { id: { in: linkedIds } },
          select: {
            id: true,
            content: true,
            category: true,
            localDate: true,
            localTime: true,
          },
          orderBy: { createdAt: "asc" },
        });
      }

      return {
        id: fruit.id,
        content: fruit.content,
        localDate: fruit.localDate,
        localTime: fruit.localTime,
        createdAt: fruit.createdAt,
        linkedEntries,
      };
    })
  );

  return NextResponse.json({ decisions });
}
