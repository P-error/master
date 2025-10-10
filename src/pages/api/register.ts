// src/pages/api/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// replaced by prisma singleton

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: "Login and password are required" });
  }

  try {
    // Проверяем, нет ли такого логина
    const existing = await prisma.user.findUnique({ where: { login } });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаём юзера
    const user = await prisma.user.create({
      data: {
        login,
        password: hashedPassword,
      },
    });

    return res.status(200).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Failed to register user" });
  }
}
