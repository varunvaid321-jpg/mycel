import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Secret key for automated backups (prevents unauthorized downloads)
const BACKUP_SECRET = process.env.MYCEL_PASSPHRASE;

export async function GET(request: Request) {
  // Require backup secret as query param or Authorization header
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("key") || request.headers.get("x-backup-key");

  if (!secret || secret !== BACKUP_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Find the database file
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  const dbPath = dbUrl.replace("file:", "");

  if (!existsSync(dbPath)) {
    return NextResponse.json({ error: "database not found" }, { status: 404 });
  }

  const dbBuffer = readFileSync(dbPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `mycel-backup-${timestamp}.db`;

  return new NextResponse(dbBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(dbBuffer.length),
    },
  });
}
