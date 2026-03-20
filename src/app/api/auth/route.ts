import { NextResponse } from "next/server";
import { verifyPassphrase } from "@/lib/auth";

export async function POST(request: Request) {
  const { passphrase } = await request.json();

  if (!verifyPassphrase(passphrase)) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("mycel_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return res;
}
