import { NextResponse } from "next/server";
import { verifyPassphrase } from "@/lib/auth";

// Allowed countries: Canada and USA
// Cloudflare only reliably passes cf-ipcountry through proxy
const ALLOWED_COUNTRIES = ["CA", "US"];

const SECRET_ANSWER = "hannover";

function isAllowedLocation(request: Request): {
  allowed: boolean;
  country: string;
} {
  const country = request.headers.get("cf-ipcountry") || "";

  // In development, allow all
  if (process.env.NODE_ENV !== "production" || !country) {
    return { allowed: true, country: country || "DEV" };
  }

  const allowed = ALLOWED_COUNTRIES.some(
    (c) => c.toLowerCase() === country.toLowerCase()
  );

  return { allowed, country };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { passphrase, secretAnswer } = body;

  if (!verifyPassphrase(passphrase)) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  // Check location
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

    if (secretAnswer.toLowerCase().trim() !== SECRET_ANSWER) {
      return NextResponse.json(
        { error: "invalid_answer", message: "Wrong answer." },
        { status: 401 }
      );
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("mycel_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
