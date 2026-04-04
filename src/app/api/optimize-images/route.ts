import { NextResponse } from "next/server";
import { readdir, readFile, writeFile, stat } from "fs/promises";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const IMAGE_DIR = process.env.NODE_ENV === "production" ? "/data/images" : "./data/images";
const SECRET = process.env.MYCEL_PASSPHRASE;

export async function POST(request: Request) {
  // Protect with passphrase
  const body = await request.json().catch(() => ({}));
  if (body.secret !== SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const files = await readdir(IMAGE_DIR);
    const imageFiles = files.filter((f) =>
      /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(f)
    );

    let optimized = 0;
    let skipped = 0;
    let savedBytes = 0;
    const results: { file: string; before: number; after: number }[] = [];

    for (const fileName of imageFiles) {
      const filePath = `${IMAGE_DIR}/${fileName}`;
      const info = await stat(filePath);
      const beforeSize = info.size;

      // Skip if already small (under 500KB — likely already compressed)
      if (beforeSize < 500 * 1024) {
        skipped++;
        continue;
      }

      try {
        const raw = await readFile(filePath);
        const compressed = await sharp(raw)
          .rotate() // Auto-fix EXIF orientation
          .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        // Only write if actually smaller
        if (compressed.length < beforeSize) {
          await writeFile(filePath, compressed);
          savedBytes += beforeSize - compressed.length;
          results.push({
            file: fileName,
            before: Math.round(beforeSize / 1024),
            after: Math.round(compressed.length / 1024),
          });
          optimized++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`[optimize] Failed on ${fileName}:`, err);
        skipped++;
      }
    }

    return NextResponse.json({
      total: imageFiles.length,
      optimized,
      skipped,
      savedMB: (savedBytes / 1024 / 1024).toFixed(2),
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 }
    );
  }
}
