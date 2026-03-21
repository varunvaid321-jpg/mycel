import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Image files stored as /data/images/{id}.{ext}
  // Try common extensions
  const baseDir = process.env.NODE_ENV === "production" ? "/data/images" : "./data/images";

  for (const ext of Object.keys(MIME_TYPES)) {
    const filePath = `${baseDir}/${id}.${ext}`;
    if (existsSync(filePath)) {
      const buffer = await readFile(filePath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": MIME_TYPES[ext],
          "Cache-Control": "private, max-age=86400",
        },
      });
    }
  }

  return NextResponse.json({ error: "not found" }, { status: 404 });
}
