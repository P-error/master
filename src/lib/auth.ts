import type { NextApiRequest } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export function verifyToken(req: NextApiRequest): string | null {
  try {
    const cookies = req.headers.cookie;
    if (!cookies) return null;

    const { token } = cookie.parse(cookies);
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { login: string };
    return decoded.login;
  } catch (err) {
    return null;
  }
}
