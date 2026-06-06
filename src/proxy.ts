import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PROTECTED_PATHS = ["/dashboard"];
const AUTH_PATHS = ["/auth/login", "/auth/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("wauth")?.value;
  const session = token ? verifyToken(token) : null;

  // Redirect authenticated users away from auth pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p)) && session) {
    const dest = session.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Protect dashboard routes
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    // Role-based access
    if (pathname.startsWith("/dashboard/teacher") && session.role !== "teacher") {
      return NextResponse.redirect(new URL("/dashboard/student", request.url));
    }
    if (pathname.startsWith("/dashboard/student") && session.role !== "student") {
      return NextResponse.redirect(new URL("/dashboard/teacher", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
