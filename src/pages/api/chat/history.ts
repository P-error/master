import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const auth = requireUser(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  try {
    const rows = await prisma.chatMessage.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    // фронту удобно иметь {role, content, createdAt}
    const messages = rows.map(m => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));

    return res.status(200).json({ messages });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Failed to load history" });
  }
}
