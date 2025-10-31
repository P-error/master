// src/pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";


type Body = {
  // поддерживаем все варианты, которые может прислать фронт
  identifier?: string;
  login?: string;
  email?: string;
  username?: string;
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

  // фронт у тебя шлёт { login, password }, но поддержим и { identifier } / { email } / { username }
  const rawId =
    (body?.identifier ?? body?.login ?? body?.email ?? body?.username ?? "").toString().trim();
  const password = (body?.password ?? "").toString();

  if (!rawId || !password) {
    return res.status(400).json({ error: "Missing login/email and/or password" });
  }

  const looksLikeEmail = rawId.includes("@");
  const where = looksLikeEmail
    ? { email: rawId.toLowerCase() }
    : { login: rawId }; // при желании нормализуй login в lower-case на уровне регистрации

  const user = await prisma.user.findFirst({
    where,
    select: { id: true, login: true, email: true, password: true },
  });

  // одинаковый ответ, чтобы не палить, существует ли аккаунт
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(
    { userId: user.id, login: user.login, email: user.email ?? null },
    "7d"
  );

  setAuthCookie(res, token);

  return res.status(200).json({
    message: "Logged in",
    user: { id: user.id, login: user.login, email: user.email },
  });
}
