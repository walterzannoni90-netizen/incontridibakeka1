import { Router } from "express";
import jwt from "jsonwebtoken";
import { supabase, supabaseAnon } from "../middleware/supabaseClient";
import { authMiddleware } from "../middleware/auth";
import type { AuthenticatedRequest } from "../types";
import { requireJwtSecret } from "../config";

const router = Router();

// ========== REGISTER ==========
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password e nome sono obbligatori" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "La password deve essere di almeno 8 caratteri" });
    }

    // Verifica se email esiste già
    const { data: existing } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .single();

    if (existing) {
      return res.status(409).json({ error: "Email già registrata" });
    }

    // Crea utente con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      return res.status(400).json({ error: authError?.message || "Errore creazione utente" });
    }

    // Crea profilo
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authData.user.id,
      email,
      name,
      phone: phone || null,
    }, { onConflict: "id" });

    if (profileError) {
      console.error("Profile error:", profileError);
      // Rollback: elimina utente auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: "Errore creazione profilo" });
    }

    res.status(201).json({
      message: "Registrazione completata con successo!",
      user: { id: authData.user.id, email, name },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== LOGIN ==========
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e password sono obbligatori" });
    }

    // Login con Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    // Recupera profilo completo
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(500).json({ error: "Errore recupero profilo" });
    }

    // Genera JWT server-side
    const token = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        isAdmin: profile.is_admin || false,
        role: profile.is_admin ? "admin" : "user",
      },
      requireJwtSecret(),
      { expiresIn: "7d" }
    );

    // Setta cookie HTTP-only
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 giorni
    });

    res.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profile.name,
        is_admin: profile.is_admin || false,
        credits: profile.credits || 0,
        has_paid: profile.has_paid || false,
        subscription_tier: profile.subscription_tier || "free",
        ads_count: profile.ads_count || 0,
        is_verified: profile.is_verified || false,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== LOGOUT ==========
router.post("/logout", (_req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logout effettuato con successo" });
});

// ========== GET CURRENT USER ==========
router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user!.userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "Profilo non trovato" });
    }

    res.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        is_admin: profile.is_admin || false,
        credits: profile.credits || 0,
        has_paid: profile.has_paid || false,
        subscription_tier: profile.subscription_tier || "free",
        ads_count: profile.ads_count || 0,
        is_verified: profile.is_verified || false,
      },
    });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== UPDATE PROFILE ==========
router.patch("/profile", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, phone, whatsapp, avatar_url } = req.body;
    const userId = req.user!.userId;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (whatsapp !== undefined) updates.whatsapp = whatsapp;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Errore aggiornamento profilo" });
    }

    res.json({ user: data });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

export default router;
