import { Router } from "express";
import { supabase } from "../middleware/supabaseClient";
import { authMiddleware, adminMiddleware } from "../middleware/auth";
import type { AuthenticatedRequest } from "../types";

const router = Router();

// Tutte le route admin richiedono autenticazione + ruolo admin
router.use(authMiddleware, adminMiddleware);

// ========== GET ALL USERS ==========
router.get("/users", async (_req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Errore caricamento utenti" });
    }

    res.json({ users: users || [] });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== GET ALL ADS (including inactive) ==========
router.get("/ads", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const { data: ads, error, count } = await supabase
      .from("ads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: "Errore caricamento annunci" });
    }

    res.json({
      ads: ads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Get admin ads error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== GET PENDING REPORTS ==========
router.get("/reports", async (_req, res) => {
  try {
    const { data: reports, error } = await supabase
      .from("ad_reports")
      .select("*, ads(title), profiles(name, email)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Errore caricamento segnalazioni" });
    }

    res.json({ reports: reports || [] });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== UPDATE REPORT STATUS ==========
router.patch("/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["reviewed", "dismissed"].includes(status)) {
      return res.status(400).json({ error: "Stato non valido" });
    }

    const { data: report, error } = await supabase
      .from("ad_reports")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Errore aggiornamento segnalazione" });
    }

    res.json({ report });
  } catch (error) {
    console.error("Update report error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== APPROVE/REJECT AD ==========
router.patch("/ads/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, is_verified } = req.body;

    const updates: Record<string, any> = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (is_verified !== undefined) updates.is_verified = is_verified;

    const { data: ad, error } = await supabase
      .from("ads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Errore aggiornamento annuncio" });
    }

    res.json({ ad });
  } catch (error) {
    console.error("Update ad status error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== MAKE USER ADMIN ==========
router.patch("/users/:id/admin", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_admin } = req.body;

    const { data: user, error } = await supabase
      .from("profiles")
      .update({ is_admin: is_admin || false })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Errore aggiornamento utente" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== GET DASHBOARD STATS ==========
router.get("/stats", async (_req, res) => {
  try {
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalAds } = await supabase
      .from("ads")
      .select("*", { count: "exact", head: true });

    const { count: activeAds } = await supabase
      .from("ads")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: pendingReports } = await supabase
      .from("ad_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: totalTransactions } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    const { data: revenue } = await supabase
      .from("transactions")
      .select("amount")
      .eq("status", "completed");

    const totalRevenue = revenue?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    res.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalAds: totalAds || 0,
        activeAds: activeAds || 0,
        pendingReports: pendingReports || 0,
        totalTransactions: totalTransactions || 0,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

export default router;
