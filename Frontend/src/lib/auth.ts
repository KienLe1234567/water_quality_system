import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { decodeJwt } from "jose";

const secretKey = process.env.SECRET_KEY;
const key = new TextEncoder().encode(secretKey);

export function isExpired(exp: number) {
  const currentTimestamp = Math.floor(Date.now() / 1000);

  return currentTimestamp > exp;
}

export function getSession() {
  const accessToken = cookies().get("access_token")?.value;
  if (!accessToken) return null;
  return accessToken;
}

export function getRole() {
  const token = getSession();
  if (!token) {
    return "";
  }

  const decrypt = decodeJwt(token);
  return decrypt.role ?? "";
}

export function getUserId() {
  const token = getSession();
  if (!token) {
    return "";
  }

  const decrypt = decodeJwt(token);
  return (decrypt.id as number) ?? null;
}

export async function refresh(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) {
    return NextResponse.redirect(new URL("auth/login", request.url));
  }
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/refresh`,
    {
      method: "POST",
      headers: {
        "Set-Cookie": `refresh_token=${refreshToken}`,
      } as HeadersInit,
    }
  );
  const responseData: any = await res.json();
  console.log(responseData);

  if (res.ok) {
    const accessToken = responseData.access_token;

    const accessExpires = new Date(
      Date.now() + expiresInHours * 60 * 60 * 1000
    );
    const refreshExpires = new Date(
      Date.now() + expiresInHours * 60 * 60 * 1000
    );
    const res = NextResponse.next();
    res.cookies.set("access_token", accessToken, {
      expires: accessExpires,
      httpOnly: true,
    });
    return res;
  }
  return NextResponse.redirect(new URL("auth/login", request.url));
}

export async function logout() {
  cookies().set("access_token", "", { expires: new Date(0) });
  cookies().set("refresh_token", "", { expires: new Date(0) });
}

const expiresInHours = 720;
