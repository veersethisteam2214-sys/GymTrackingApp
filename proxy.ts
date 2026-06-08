import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname === "/profile-setup" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/profile") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/setup-login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname);

  const needsProfile =
    !request.cookies.get("gym_profile_id")?.value &&
    !isPublic &&
    pathname !== "/profile-setup";

  if (needsProfile) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
