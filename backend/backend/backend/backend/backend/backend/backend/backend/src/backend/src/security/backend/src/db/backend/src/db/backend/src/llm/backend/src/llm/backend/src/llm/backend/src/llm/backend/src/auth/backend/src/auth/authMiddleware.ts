import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./authUtils";

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant. Connecte-toi d'abord." });
  }

  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}
