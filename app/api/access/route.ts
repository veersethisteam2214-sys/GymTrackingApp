import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/dashboard");
  const expected = process.env.APP_ACCESS_PASSWORD;

  if (!expected || password === expected) {
    const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
    response.cookies.set("gym_access_granted", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 14,
      path: "/"
    });
    return response;
  }

  return NextResponse.redirect(new URL(`/access?error=1&next=${encodeURIComponent(nextPath)}`, request.url), 303);
}

