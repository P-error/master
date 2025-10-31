// src/pages/api/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

type Body = {
  login?: string;
  email?: string;
  password?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body: Body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const login = (body?.login || "").trim();
  const email = (body?.email || "").trim().toLowerCase() || null;
  const password = body?.password || "";

  if (!login || !password) {
    return res.status(400).json({ error: "Missing login or password" });
  }

  const exists = await prisma.user.findFirst({
    where: { OR: [{ login }, email ? { email } : undefined].filter(Boolean) as any },
    select: { id: true },
  });
  if (exists) return res.status(409).json({ error: "User already exists" });

  const hash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: { login, email, password: hash },
    select: { id: true, login: true, email: true },
  });

  const token = signToken({ userId: created.id, login: created.login, email: created.email ?? null }, "7d");
  setAuthCookie(res, token);

  return res.status(201).json({ message: "Registered", user: created });
}
