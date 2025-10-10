// src/pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookie from "cookie"; // 👈 важно!

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: "Login and password required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { login } });
    if (!user) return res.status(401).json({ error: "Invalid login or password" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid login or password" });

    // создаем JWT токен
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "dev_secret", {
      expiresIn: "1h",
    });

    // ставим cookie
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60, // 1 час
        path: "/",
      })
    );

    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}
