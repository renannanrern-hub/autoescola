import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const adminSessionCookie = "adminSession";

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? "dev-admin-secret";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminSessionValue() {
  const payload = "dirija-admin";
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");

  return `${payload}.${signature}`;
}

export function isValidAdminSession(value: string | undefined) {
  if (!value) {
    return false;
  }

  const [payload, signature] = value.split(".");

  if (payload !== "dirija-admin" || !signature) {
    return false;
  }

  const expected = createAdminSessionValue();

  return safeEqual(value, expected);
}

export function isAdminRequest(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(adminSessionCookie)?.value);
}
