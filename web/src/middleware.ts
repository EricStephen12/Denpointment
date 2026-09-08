import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY =
  process.env.AUTH_SECRET ||
  "denpointment_secret_key_change_in_production_min32chars!";
const key = new TextEncoder().encode(SECRET_KEY);

const SESSION_COOKIE_NAME = "denpointment_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect_url", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, key, { algorithms: ["HS256"] });
      return NextResponse.next();
    } catch {
      // Invalid or expired token
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect_url", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
