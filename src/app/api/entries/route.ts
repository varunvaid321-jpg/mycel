import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classify } from "@/lib/classifier";
import { autoCorrect } from "@/lib/ai";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

const IMAGE_DIR = process.env.NODE_ENV === "production" ? "/data/images" : "./data/images";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const topic = searchParams.get("topic");
  const search = searchParams.get("search");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

  const where: Record<string, unknown> = { archived: false };

  if (category && category !== "all") {
    where.category = category;
  }

  // For search, we'll filter after fetch since SQLite doesn't support case-insensitive contains
  const searchTerm = search?.toLowerCase() || "";

  // Topic filtering via tags field (comma-separated)
  if (topic && topic !== "all") {
    where.tags = { contains: topic };
  }

  if (searchTerm) {
    // Fetch entries with category/topic filters applied, then search in-memory
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
  const contentType = request.headers.get("content-type") || "";

  let content: string;
  let localDate: string;
  let localTime: string;
  let imageFiles: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    content = (formData.get("content") as string) || "";
    localDate = (formData.get("localDate") as string) || "";
    localTime = (formData.get("localTime") as string) || "";
    const images = formData.getAll("image") as File[];
    imageFiles = images.filter((f) => f && f.size > 0).slice(0, 3);
  } else {
    const body = await request.json();
    content = body.content || "";
    localDate = body.localDate || "";
    localTime = body.localTime || "";
  }

  // Allow empty content if there's an image
  if (!content?.trim() && imageFiles.length === 0) {
    return NextResponse.json({ error: "content or image required" }, { status: 400 });
  }

  // Auto-correct typos and bad grammar (only if there's text)
  const corrected = content.trim() ? await autoCorrect(content.trim()) : "";

  // Auto-classify (on corrected text for better accuracy)
  const { category, topics } = corrected ? classify(corrected) : { category: "spore", topics: [] as string[] };
  const hasImages = imageFiles.length > 0;

  // Auto-link: if fruit, find related recent spores/signals by keyword overlap
  let linkedEntryIds = "";
  if (category === "fruit" && corrected) {
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
      content: corrected || (hasImages ? "📷" : ""),
      category,
      tags: topics.join(","),
      localDate,
      localTime,
      linkedEntryIds,
    },
  });

  // Save images if provided (up to 3)
  if (imageFiles.length > 0) {
    try {
      if (!existsSync(IMAGE_DIR)) {
        await mkdir(IMAGE_DIR, { recursive: true });
      }

      const savedPaths: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = ["jpg", "jpeg", "png", "webp", "gif", "heic"].includes(ext) ? ext : "jpg";
        const suffix = i === 0 ? "" : `_${i + 1}`;
        const fileName = `${entry.id}${suffix}.${safeExt}`;
        const filePath = `${IMAGE_DIR}/${fileName}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);
        savedPaths.push(fileName);
      }

      // Update entry with comma-separated image paths
      await prisma.entry.update({
        where: { id: entry.id },
        data: { imagePath: savedPaths.join(",") },
      });

      const updated = await prisma.entry.findUnique({ where: { id: entry.id } });
      return NextResponse.json(updated, { status: 201 });
    } catch (err) {
      console.error("[upload] Failed to save image:", err instanceof Error ? err.message : err);
      // Entry saved without images — don't fail the whole request
    }
  }

  return NextResponse.json(entry, { status: 201 });
}
