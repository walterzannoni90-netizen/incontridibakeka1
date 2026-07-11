import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types";
import { supabase } from "./supabaseClient";
import { requireJwtSecret } from "../config";

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const bearerToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = req.cookies?.auth_token || bearerToken;

  if (!token) {
    return res.status(401).json({ error: "Non autenticato. Effettua il login." });
  }

  try {
    const decoded = jwt.verify(token, requireJwtSecret(), {
      algorithms: ["HS256"],
    }) as {
      userId: string;
      email: string;
    };

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", decoded.userId)
      .single();

    if (error || !profile) {
      return res.status(401).json({ error: "Utente non valido o disabilitato." });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      isAdmin: profile.is_admin === true,
      role: profile.is_admin === true ? "admin" : "user",
    };
    next();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("JWT_SECRET")) {
      console.error(error.message);
      return res.status(500).json({ error: "Autenticazione server non configurata." });
    }
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
