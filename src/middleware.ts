import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function verifyToken(token: string): boolean {
  try {
    const decoded = atob(token);
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot === -1) return false;

    const data = decoded.slice(0, lastDot);

    // Check expiry from payload
    const payload = JSON.parse(data);
    const age = Date.now() - payload.ts;
    if (age > SESSION_MAX_AGE_MS) return false;

    // Token exists and has valid structure — full HMAC check happens server-side
    // Middleware just checks structure + expiry for speed
    return lastDot > 10 && payload.r && payload.ts;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/logout") ||
    pathname.startsWith("/api/backup") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("mycel_session");

  if (!session?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify signed token structure + expiry
  if (!verifyToken(session.value)) {
    // Token expired or invalid — redirect to login
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.set("mycel_session", "", { path: "/", maxAge: 0 });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
