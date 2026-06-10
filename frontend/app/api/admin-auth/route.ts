import { NextResponse } from "next/server";
import { adminSessionCookie, createAdminSessionValue } from "@/lib/admin-auth";

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@dirijamelhor.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (body.email !== adminEmail || body.password !== adminPassword) {
    return NextResponse.json({ message: "E-mail ou senha invalidos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookie, createAdminSessionValue(), {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookie, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
