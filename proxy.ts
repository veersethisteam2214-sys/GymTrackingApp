import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

export function proxy(request: NextRequest) {
  const hasAccessPassword = Boolean(process.env.APP_ACCESS_PASSWORD);
  const passedAccess = request.cookies.get("gym_access_granted")?.value === "true";
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname === "/access" ||
    pathname === "/access-denied" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/access") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname);

  if (hasAccessPassword && !passedAccess && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/access";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};

