import { NextResponse } from "next/server";
import { verifyPassphrase } from "@/lib/auth";

// Allowed regions: Toronto area (ON, Canada) and Michigan (MI, USA)
const ALLOWED_REGIONS = [
  { country: "CA", region: "ON" },
  { country: "US", region: "MI" },
];

const SECRET_ANSWER = "hannover";

function isAllowedLocation(request: Request): {
  allowed: boolean;
  country: string;
  region: string;
  city: string;
} {
  const headers = request.headers;
  const country = headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country") || "";
  const region = headers.get("cf-region") || headers.get("x-vercel-ip-country-region") || "";
  const city = headers.get("cf-ipcity") || headers.get("x-vercel-ip-city") || "";

  // In development, allow all
  if (process.env.NODE_ENV !== "production") {
    return { allowed: true, country: "DEV", region: "DEV", city: "localhost" };
  }

  const allowed = ALLOWED_REGIONS.some(
    (r) =>
      r.country.toLowerCase() === country.toLowerCase() &&
      r.region.toLowerCase() === region.toLowerCase()
  );

  return { allowed, country, region, city };
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
    // Passphrase correct but location is suspicious
    if (!secretAnswer) {
      // Ask for secret question
      return NextResponse.json(
        {
          error: "location_challenge",
          message: "Unusual login location detected.",
          question: "What was the name of the city in Germany you lived in?",
          location: `${geo.city}, ${geo.region}, ${geo.country}`,
        },
        { status: 403 }
      );
    }

    // Verify secret answer
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
