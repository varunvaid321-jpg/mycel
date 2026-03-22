import { NextResponse } from "next/server";
import { verifyPassphrase } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// ── Config ───────────────────────────────────────────────────
const ALLOWED_COUNTRIES = ["CA", "US"];
const SECRET_ANSWER_GEO = "hannover";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 60;
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

// Lockout recovery questions (all 3 must be correct)
// Answers stored in env vars — never hardcode PII in source
const RECOVERY_QUESTIONS = [
  { question: "What city do you currently live in?", answer: process.env.MYCEL_RECOVERY_1?.toLowerCase() || "" },
  { question: "What is your street name?", answer: process.env.MYCEL_RECOVERY_2?.toLowerCase() || "" },
  { question: "What is your wife's first name?", answer: process.env.MYCEL_RECOVERY_3?.toLowerCase() || "" },
];

// ── In-memory rate limiter ───────────────────────────────────
// Map of IP → { attempts, lockedUntil }
const rateLimiter = new Map<string, { attempts: number; lockedUntil: number }>();

function getClientIP(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  lockedMinutes: number;
} {
  const entry = rateLimiter.get(ip);

  if (!entry) {
    return { allowed: true, remaining: MAX_ATTEMPTS, lockedMinutes: 0 };
  }

  // Check if lockout has expired
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const minutesLeft = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
    return { allowed: false, remaining: 0, lockedMinutes: minutesLeft };
  }

  // Reset if lockout expired
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    rateLimiter.delete(ip);
    return { allowed: true, remaining: MAX_ATTEMPTS, lockedMinutes: 0 };
  }

  return {
    allowed: entry.attempts < MAX_ATTEMPTS,
    remaining: MAX_ATTEMPTS - entry.attempts,
    lockedMinutes: 0,
  };
}

function recordFailedAttempt(ip: string): { locked: boolean; remaining: number } {
  const entry = rateLimiter.get(ip) || { attempts: 0, lockedUntil: 0 };
  entry.attempts += 1;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
    rateLimiter.set(ip, entry);
    return { locked: true, remaining: 0 };
  }

  rateLimiter.set(ip, entry);
  return { locked: false, remaining: MAX_ATTEMPTS - entry.attempts };
}

function clearAttempts(ip: string) {
  rateLimiter.delete(ip);
}

// ── Signed session token ─────────────────────────────────────
function createSessionToken(): string {
  const payload = {
    ts: Date.now(),
    r: crypto.randomBytes(16).toString("hex"),
  };
  const data = JSON.stringify(payload);
  const secret = process.env.MYCEL_PASSPHRASE;
  if (!secret) throw new Error("MYCEL_PASSPHRASE env var is required");
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return Buffer.from(`${data}.${hmac}`).toString("base64");
}

function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot === -1) return false;

    const data = decoded.slice(0, lastDot);
    const hmac = decoded.slice(lastDot + 1);

    const secret = process.env.MYCEL_PASSPHRASE;
  if (!secret) throw new Error("MYCEL_PASSPHRASE env var is required");
    const expected = crypto.createHmac("sha256", secret).update(data).digest("hex");

    if (hmac !== expected) return false;

    // Check expiry
    const payload = JSON.parse(data);
    const age = Date.now() - payload.ts;
    if (age > SESSION_MAX_AGE * 1000) return false;

    return true;
  } catch {
    return false;
  }
}

// ── Geo check ────────────────────────────────────────────────
function isAllowedLocation(request: Request): { allowed: boolean; country: string } {
  const country = request.headers.get("cf-ipcountry") || "";
  if (process.env.NODE_ENV !== "production" || !country) {
    return { allowed: true, country: country || "DEV" };
  }
  const allowed = ALLOWED_COUNTRIES.some(
    (c) => c.toLowerCase() === country.toLowerCase()
  );
  return { allowed, country };
}

// ── Main handler ─────────────────────────────────────────────
export async function POST(request: Request) {
  const ip = getClientIP(request);
  const body = await request.json();
  const { passphrase, secretAnswer, recoveryAnswers } = body;

  // ── Check if locked out ──
  const rateCheck = checkRateLimit(ip);

  if (!rateCheck.allowed) {
    // Locked out — check recovery answers
    if (recoveryAnswers && Array.isArray(recoveryAnswers)) {
      const allCorrect = RECOVERY_QUESTIONS.every(
        (q, i) =>
          recoveryAnswers[i] &&
          recoveryAnswers[i].toLowerCase().trim() === q.answer
      );

      if (allCorrect) {
        // Recovery successful — clear lockout, still need passphrase
        clearAttempts(ip);
        return NextResponse.json({
          error: "recovery_success",
          message: "Identity verified. Enter your passphrase.",
        });
      }

      return NextResponse.json(
        { error: "recovery_failed", message: "Wrong answers. Still locked." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "locked",
        message: `Too many failed attempts. Locked for ${rateCheck.lockedMinutes} minutes.`,
        questions: RECOVERY_QUESTIONS.map((q) => q.question),
      },
      { status: 429 }
    );
  }

  // ── Verify passphrase ──
  if (!verifyPassphrase(passphrase)) {
    const result = recordFailedAttempt(ip);
    if (result.locked) {
      return NextResponse.json(
        {
          error: "locked",
          message: `Account locked for ${LOCKOUT_MINUTES} minutes.`,
          questions: RECOVERY_QUESTIONS.map((q) => q.question),
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      {
        error: "invalid",
        remaining: result.remaining,
      },
      { status: 401 }
    );
  }

  // ── Geo check ──
  const geo = isAllowedLocation(request);
  if (!geo.allowed) {
    if (!secretAnswer) {
      return NextResponse.json(
        {
          error: "location_challenge",
          question: "What was the name of the city in Germany you lived in?",
          location: geo.country,
        },
        { status: 403 }
      );
    }
    if (secretAnswer.toLowerCase().trim() !== SECRET_ANSWER_GEO) {
      const result = recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "invalid_answer", remaining: result.remaining },
        { status: 401 }
      );
    }
  }

  // ── Success — create signed session ──
  clearAttempts(ip);
  const token = createSessionToken();

  const res = NextResponse.json({ ok: true });
  res.cookies.set("mycel_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return res;
}
