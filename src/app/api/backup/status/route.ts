import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BACKUP_SECRET = process.env.MYCEL_PASSPHRASE;

// Store backup status in the config table (reuse the DB)
export async function POST(request: Request) {
  const secret = request.headers.get("x-backup-key");
  if (!secret || secret !== BACKUP_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Use prisma raw query to upsert config
  await prisma.$executeRawUnsafe(
    `INSERT INTO Entry (id, content, category, localDate, localTime, createdAt, updatedAt, isPublic, archived, tags, linkedEntryIds)
     VALUES ('__backup_status__', ?, 'system', '', '', datetime('now'), datetime('now'), 0, 1, 'system', '')
     ON CONFLICT(id) DO UPDATE SET content = ?, updatedAt = datetime('now')`,
    JSON.stringify(body),
    JSON.stringify(body)
  );

  return NextResponse.json({ ok: true });
}

export async function GET() {
  try {
    const entry = await prisma.entry.findUnique({
      where: { id: "__backup_status__" },
    });

    if (!entry) {
      return NextResponse.json({
        status: "never",
        message: "No backup has ever run",
      });
    }

    const status = JSON.parse(entry.content);
    const lastBackup = new Date(status.timestamp);
    const hoursAgo = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60);

    return NextResponse.json({
      ...status,
      hoursAgo: Math.round(hoursAgo),
      overdue: hoursAgo > 25, // Alert if more than 25 hours since last backup
    });
  } catch {
    return NextResponse.json({ status: "unknown" });
  }
}
