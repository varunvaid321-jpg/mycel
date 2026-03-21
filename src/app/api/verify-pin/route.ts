import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Track failed attempts per session (in-memory, resets on deploy)
let failedAttempts = 0;
let lockedUntil = 0;

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(request: Request) {
  const now = Date.now();

  // Check lockout
  if (now < lockedUntil) {
    const remainingSec = Math.ceil((lockedUntil - now) / 1000);
    return NextResponse.json(
      { error: "locked", remainingSec },
      { status: 429 }
    );
  }

  const { pin } = await request.json();
  const correctPin = process.env.MYCEL_PIN;

  if (!correctPin) {
    // No PIN configured — pass through (backwards compatible)
    return NextResponse.json({ ok: true });
  }

  if (String(pin) === String(correctPin)) {
    failedAttempts = 0;
    return NextResponse.json({ ok: true });
  }

  // Wrong PIN
  failedAttempts++;

  if (failedAttempts >= MAX_ATTEMPTS) {
    lockedUntil = now + LOCKOUT_MS;
    failedAttempts = 0;
    return NextResponse.json(
      { error: "locked", remainingSec: Math.ceil(LOCKOUT_MS / 1000) },
      { status: 429 }
    );
  }

  return NextResponse.json(
    { error: "wrong", remaining: MAX_ATTEMPTS - failedAttempts },
    { status: 401 }
  );
}
