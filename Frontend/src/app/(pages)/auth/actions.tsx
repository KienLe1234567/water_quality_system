"use server";

import { cookies } from "next/headers";

import { decodeJwt } from "jose";

type FormState = {
  type: string;
  value: string[];
  key?: string;
};

export async function login(prevState: FormState, formData: FormData) {
  const data = {
    username: formData.get("username")?.toString()!,
    password: formData.get("password")?.toString()!,
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: data.username,
        password: data.password,
      }),
    }
  );
  const responseData: any = await res.json();

  let responseState: FormState;

  if (res.ok) {
    const accessToken = responseData.access_token;
    const cookie = res.headers.get("set-cookie");
    const refreshTokenMatch = cookie!.match(/refresh_token=([^;]+)/);
    const refreshToken = refreshTokenMatch![1];

    const decode = decodeJwt(accessToken);

    const accessExpires = new Date(
      // Date.now() + responseData.expiresIn * 1000 * 10
      Date.now() + 720 * 60 * 60 * 1000
    );
    const refreshExpires = new Date(
      // Date.now() + responseData.expiresIn * 1000 * 10
      Date.now() + 720 * 60 * 60 * 1000
    );
    cookies().set("access_token", accessToken, {
      expires: accessExpires,
      httpOnly: true,
    });
    cookies().set("refresh_token", refreshToken, {
      expires: refreshExpires,
      httpOnly: true,
    });
    responseState = {
      type: "success",
      value: ["Login successfully"],
    };
    return responseState;
  }

  responseState = {
    type: "fail",
    value: ["Fail"],
  };
  return responseState;
}

export async function register(prevState: FormState, formData: FormData) {
  const data = {
    name: formData
      .get("fname")
      ?.toString()!
      .concat(" ", formData.get("lname")?.toString()!),
    username: formData.get("username")?.toString()!,
    email: formData.get("email")?.toString()!,
    password: formData.get("password")?.toString()!,
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
  const responseData: any = await res.json();

  console.log(responseData);

  let mes: FormState;

  if (res.ok) {
    mes = {
      type: "success",
      value: ["Register successfully"],
    };
  } else {
    mes = {
      type: "fail",
      value: ["Fail"],
    };
  }

  return mes;
}

export async function logout() {
  cookies().set("access_token", "", { expires: new Date(0) });
  cookies().set("refresh_token", "", { expires: new Date(0) });
}
