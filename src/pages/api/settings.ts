// src/pages/api/settings.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import jwt, { JwtPayload } from "jsonwebtoken";

type SettingsOut = {
  darkMode: boolean | null;
  accessibleMode: boolean | null;
  fontSize: string | null; // "small" | "medium" | "large" | др. варианты
};

// --- helpers ---

function getCookieFromHeader(req: NextApiRequest, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const parts = raw.split(/; */);
  for (const part of parts) {
    const [k, ...rest] = part.split("=");
    if (decodeURIComponent(k.trim()) === name) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return null;
}

async function getCurrentUserId(req: NextApiRequest): Promise<number | null> {
  const token = getCookieFromHeader(req, "token");
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[/api/settings] Missing JWT_SECRET");
    return null;
  }

  let payload: string | JwtPayload;
  try {
    payload = jwt.verify(token, secret) as JwtPayload | string;
  } catch {
    return null;
  }

  if (typeof payload === "object" && payload !== null) {
    if (typeof payload.userId === "number") return payload.userId;

    if (typeof payload.login === "string") {
      const u = await prisma.user.findUnique({
        where: { login: payload.login },
        select: { id: true },
      });
      return u?.id ?? null;
    }
  }

  if (typeof payload === "string") {
    const u = await prisma.user.findUnique({
      where: { login: payload },
      select: { id: true },
    });
    return u?.id ?? null;
  }

  return null;
}

function toBool(v: any): boolean | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return null;
}

function normalizeFontSize(v: any): string | null {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).toLowerCase().trim();
  // Разрешённые значения; при желании расширь
  const allowed = new Set(["small", "medium", "large"]);
  if (allowed.has(s)) return s;
  // Если проект допускает произвольные строки — можно снять ограничение:
  // if (s.length <= 50) return s;
  return null;
}

// --- handler ---

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    if (req.method === "GET") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { darkMode: true, accessibleMode: true, fontSize: true },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const out: SettingsOut = {
        darkMode: user.darkMode,
        accessibleMode: user.accessibleMode,
        fontSize: user.fontSize,
      };

      res.status(200).json({ settings: out });
      return;
    }

    if (req.method === "PUT") {
      const raw = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
      const data: Record<string, any> = {};

      if ("darkMode" in raw) {
        const v = toBool(raw.darkMode);
        if (v === null) {
          res.status(400).json({ error: "Invalid darkMode (expected boolean)" });
          return;
        }
        data.darkMode = v;
      }

      if ("accessibleMode" in raw) {
        const v = toBool(raw.accessibleMode);
        if (v === null) {
          res.status(400).json({ error: "Invalid accessibleMode (expected boolean)" });
          return;
        }
        data.accessibleMode = v;
      }

      if ("fontSize" in raw) {
        const v = normalizeFontSize(raw.fontSize);
        if (v === null) {
          res.status(400).json({ error: "Invalid fontSize (allowed: small|medium|large)" });
          return;
        }
        data.fontSize = v;
      }

      if (Object.keys(data).length === 0) {
        res.status(400).json({ error: "No updatable fields provided" });
        return;
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data,
        select: { darkMode: true, accessibleMode: true, fontSize: true },
      });

      res.status(200).json({ settings: updated });
      return;
    }

    res.setHeader("Allow", "GET, PUT");
    res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error("[/api/settings] error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
