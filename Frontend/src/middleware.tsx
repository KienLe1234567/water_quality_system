import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { decodeJwt } from "jose";

import { isExpired, refresh } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const accessToken = cookies().get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  const decoded = decodeJwt(accessToken);

  if (isExpired(decoded.exp!)) {
    return await refresh(request);
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth/register|auth/login).*)",
  ],
};
