import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/access", request.url), 303);
  response.cookies.delete("gym_access_granted");
  response.cookies.delete("gym_profile_id");
  return response;
}
