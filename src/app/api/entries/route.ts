import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classify } from "@/lib/classifier";
import { autoCorrect } from "@/lib/ai";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const IMAGE_DIR = process.env.NODE_ENV === "production" ? "/data/images" : "./data/images";

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
  const searchTerm = search?.toLowerCase() || "";

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

  const trimmed = content.trim();
  const hasImages = imageFiles.length > 0;

  // Classify on original text (local, instant — no AI)
  const { category, topics } = trimmed ? classify(trimmed) : { category: "spore", topics: [] as string[] };

  // Auto-link: if fruit, find related recent spores/signals by keyword overlap
  let linkedEntryIds = "";
  if (category === "fruit" && trimmed) {
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
      trimmed
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

  // Save immediately with original text — user sees "planted" instantly
  const entry = await prisma.entry.create({
    data: {
      content: trimmed || (hasImages ? "📷" : ""),
      category,
      tags: topics.join(","),
      localDate,
      localTime,
      linkedEntryIds,
    },
  });

  // Auto-correct in background — update entry if correction differs
  if (trimmed) {
    autoCorrect(trimmed).then((corrected) => {
      if (corrected && corrected !== trimmed) {
        prisma.entry.update({
          where: { id: entry.id },
          data: { content: corrected },
        }).catch((err) => console.error("[autocorrect] update failed:", err));
      }
    }).catch((err) => console.error("[autocorrect] failed:", err));
  }

  // Save images if provided (up to 3)
  if (imageFiles.length > 0) {
    try {
      if (!existsSync(IMAGE_DIR)) {
        await mkdir(IMAGE_DIR, { recursive: true });
      }

      const savedPaths: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const suffix = i === 0 ? "" : `_${i + 1}`;
        const fileName = `${entry.id}${suffix}.jpg`;
        const filePath = `${IMAGE_DIR}/${fileName}`;

        const raw = Buffer.from(await file.arrayBuffer());
        // Compress: resize to max 2000px wide, convert to JPEG 80% quality
        const compressed = await sharp(raw)
          .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        console.log(`[upload] ${file.name}: ${(raw.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB`);
        await writeFile(filePath, compressed);
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
