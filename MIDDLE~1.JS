import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect /user/* routes — must be logged in
  if (pathname.startsWith("/user")) {
    const token = request.cookies.get("as_token")?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect /admin/* routes — must be admin
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("as_token")?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload || !payload.is_admin) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/admin/:path*"],
};
