// src/lib/auth.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as jwt from "jsonwebtoken";

export type AuthPayload = { userId: number; login: string; email: string | null };

export const COOKIE_NAME = "token";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment");
  }
  return secret;
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of (header || "").split(";")) {
    const [k, ...rest] = part.split("=");
    if (!k) continue;
    const key = k.trim();
    const val = rest.join("=").trim();
    if (key) out[key] = decodeURIComponent(val || "");
  }
  return out;
}

/** Подписать JWT токен; по умолчанию 30 дней */
export function signToken(payload: AuthPayload, expiresIn: string = "30d"): string {
  return jwt.sign(payload as any, getJwtSecret(), { expiresIn } as any);
}

function verifyToken(token: string | null): AuthPayload | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const p = decoded as any;
    if (
      p &&
      typeof p.userId === "number" &&
      typeof p.login === "string" &&
      (typeof p.email === "string" || p.email === null || typeof p.email === "undefined")
    ) {
      return { userId: p.userId, login: p.login, email: p.email ?? null };
    }
    return null;
  } catch {
    return null;
  }
}

function getTokenFromReq(req: NextApiRequest): string | null {
  // 1) Cookie: token=<jwt>
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[COOKIE_NAME]) return cookies[COOKIE_NAME];

  // 2) Authorization: Bearer <token>
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();

  return null;
}

/** Вернуть payload или null (не бросает 401 сам по себе) */
export function requireUser(req: NextApiRequest): AuthPayload | null {
  const token = getTokenFromReq(req);
  return verifyToken(token);
}

/** Построить строку Set-Cookie для сессии */
export function buildSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  return [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    isProd ? "Secure" : "",   // в проде — обязательно Secure
    "SameSite=Lax",
    "Max-Age=2592000",        // 30 дней
  ]
    .filter(Boolean)
    .join("; ");
}

/** Установить cookie сессии в ответе */
export function setAuthCookie(res: NextApiResponse, token: string) {
  res.setHeader("Set-Cookie", buildSessionCookie(token));
}

/** Стереть cookie сессии (logout) */
export function clearAuthCookie(res: NextApiResponse) {
  const isProd = process.env.NODE_ENV === "production";
  const cookie = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    isProd ? "Secure" : "",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ]
    .filter(Boolean)
    .join("; ");
  res.setHeader("Set-Cookie", cookie);
}
