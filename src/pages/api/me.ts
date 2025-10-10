// src/pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // ⚠️ вынести в .env

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Читаем куки
    const cookies = req.headers.cookie;
    if (!cookies) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { token } = cookie.parse(cookies);
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Проверяем токен
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Ищем юзера
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        login: true,
        age: true,
        educationLevel: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error("Me API error:", err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
}
