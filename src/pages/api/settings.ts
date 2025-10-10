import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let userId: number;
  try {
    const decoded: any = verify(token, process.env.JWT_SECRET || "dev_secret");
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { darkMode: true, accessibleMode: true, fontSize: true },
      });
      return res.status(200).json(user);
    } catch (err) {
      console.error("[settings GET]", err);
      return res.status(500).json({ error: "Failed to fetch settings" });
    }
  }

  if (req.method === "POST") {
    const { darkMode, accessibleMode, fontSize } = req.body;

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { darkMode, accessibleMode, fontSize },
      });
      return res.status(200).json(user);
    } catch (err) {
      console.error("[settings POST]", err);
      return res.status(500).json({ error: "Failed to update settings" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
