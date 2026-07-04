import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Non autenticato. Effettua il login." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      isAdmin: boolean;
      role: string;
    };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token non valido o scaduto." });
  }
}

export function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Accesso negato. Solo admin." });
  }
  next();
}
