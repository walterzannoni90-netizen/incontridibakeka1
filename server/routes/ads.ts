import { Router } from "express";
import { supabase } from "../middleware/supabaseClient";
import { authMiddleware } from "../middleware/auth";
import type { AuthenticatedRequest } from "../types";

const router = Router();

// ========== GET ALL ADS (public) ==========
router.get("/", async (_req, res) => {
  try {
    const { data: ads, error } = await supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .order("is_sponsored", { ascending: false })
      .order("is_premium", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get ads error:", error);
      return res.status(500).json({ error: "Errore caricamento annunci" });
    }

    res.json({ ads: ads || [] });
  } catch (error) {
    console.error("Get ads error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== GET ADS WITH PAGINATION ==========
router.get("/paginated", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    const { data: ads, error, count } = await supabase
      .from("ads")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("is_sponsored", { ascending: false })
      .order("is_premium", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Get paginated ads error:", error);
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
    console.error("Get paginated ads error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== GET SINGLE AD ==========
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: ad, error } = await supabase
      .from("ads")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !ad) {
      return res.status(404).json({ error: "Annuncio non trovato" });
    }

    // Incrementa views
    await supabase
      .from("ads")
      .update({ views: (ad.views || 0) + 1 })
      .eq("id", id);

    res.json({ ad: { ...ad, views: (ad.views || 0) + 1 } });
  } catch (error) {
    console.error("Get ad error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== GET ADS BY CATEGORY ==========
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    const { data: ads, error, count } = await supabase
      .from("ads")
      .select("*", { count: "exact" })
      .eq("category", category)
      .eq("is_active", true)
      .order("is_sponsored", { ascending: false })
      .order("is_premium", { ascending: false })
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
    console.error("Get category ads error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== GET ADS BY CITY ==========
router.get("/city/:city", async (req, res) => {
  try {
    const { city } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    const { data: ads, error, count } = await supabase
      .from("ads")
      .select("*", { count: "exact" })
      .eq("city", city)
      .eq("is_active", true)
      .order("is_sponsored", { ascending: false })
      .order("is_premium", { ascending: false })
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
    console.error("Get city ads error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== SEARCH ADS ==========
router.get("/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    const { data: ads, error, count } = await supabase
      .from("ads")
      .select("*", { count: "exact" })
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq("is_active", true)
      .order("is_sponsored", { ascending: false })
      .order("is_premium", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(500).json({ error: "Errore ricerca annunci" });
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
    console.error("Search ads error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== CREATE AD (authenticated) ==========
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const {
      title,
      description,
      city,
      country,
      age,
      category,
      image,
      images,
      price,
      phone,
      whatsapp,
      hair_color,
      body_type,
      ethnicity,
      services,
      availability_hours,
      height,
      weight,
    } = req.body;

    // Validazione
    if (!title || !description || !city || !category) {
      return res.status(400).json({ error: "Titolo, descrizione, città e categoria sono obbligatori" });
    }

    if (title.length < 5 || title.length > 100) {
      return res.status(400).json({ error: "Il titolo deve essere tra 5 e 100 caratteri" });
    }

    if (description.length < 20 || description.length > 2000) {
      return res.status(400).json({ error: "La descrizione deve essere tra 20 e 2000 caratteri" });
    }

    // Recupera profilo utente per controllare limiti
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, has_paid, ads_count")
      .eq("id", userId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: "Profilo non trovato" });
    }

    // Verifica limite annunci giornaliero (semplificato: controlla ultimi 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: todayAds } = await supabase
      .from("ads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", yesterday);

    const dailyLimit = profile.has_paid ? 2 : 1;
    if ((todayAds || 0) >= dailyLimit) {
      return res.status(429).json({
        error: `Hai raggiunto il limite di ${dailyLimit} annunci giornalieri. Acquista crediti per aumentare il limite.`,
      });
    }

    // Crea annuncio
    const { data: ad, error } = await supabase
      .from("ads")
      .insert({
        user_id: userId,
        title,
        description,
        city,
        country: country || "IT",
        age: age || null,
        category,
        image: image || null,
        images: images || null,
        price: price || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        hair_color: hair_color || null,
        body_type: body_type || null,
        ethnicity: ethnicity || null,
        services: services || null,
        availability_hours: availability_hours || null,
        height: height || null,
        weight: weight || null,
        has_paid: profile.has_paid || false,
        is_active: true,
        is_premium: false,
        is_sponsored: false,
        is_verified: false,
        rating: 5,
        review_count: 0,
        views: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Create ad error:", error);
      return res.status(500).json({ error: "Errore creazione annuncio" });
    }

    // Aggiorna ads_count del profilo
    await supabase
      .from("profiles")
      .update({ ads_count: (profile.ads_count || 0) + 1 })
      .eq("id", userId);

    res.status(201).json({ ad });
  } catch (error) {
    console.error("Create ad error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== UPDATE AD (authenticated, owner only) ==========
router.patch("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.isAdmin;

    // Verifica proprietà
    const { data: existingAd } = await supabase
      .from("ads")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existingAd) {
      return res.status(404).json({ error: "Annuncio non trovato" });
    }

    if (existingAd.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: "Non autorizzato a modificare questo annuncio" });
    }

    const updates: Record<string, any> = {};
    const allowedFields = [
      "title", "description", "city", "country", "age", "category",
      "image", "images", "price", "phone", "whatsapp",
      "hair_color", "body_type", "ethnicity", "services",
      "availability_hours", "height", "weight", "is_active",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    updates.updated_at = new Date().toISOString();

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
    console.error("Update ad error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== DELETE AD (authenticated, owner only) ==========
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.isAdmin;

    // Verifica proprietà
    const { data: existingAd } = await supabase
      .from("ads")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existingAd) {
      return res.status(404).json({ error: "Annuncio non trovato" });
    }

    if (existingAd.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: "Non autorizzato a eliminare questo annuncio" });
    }

    const { error } = await supabase
      .from("ads")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: "Errore eliminazione annuncio" });
    }

    res.json({ message: "Annuncio eliminato con successo" });
  } catch (error) {
    console.error("Delete ad error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== GET MY ADS (authenticated) ==========
router.get("/my/ads", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const { data: ads, error } = await supabase
      .from("ads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Errore caricamento annunci" });
    }

    res.json({ ads: ads || [] });
  } catch (error) {
    console.error("Get my ads error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== BOOST AD (authenticated) ==========
router.post("/:id/boost", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { type, duration_days, credits } = req.body;

    if (!type || !duration_days || !credits) {
      return res.status(400).json({ error: "Tipo, durata e crediti sono obbligatori" });
    }

    // Verifica proprietà annuncio
    const { data: ad } = await supabase
      .from("ads")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!ad) {
      return res.status(404).json({ error: "Annuncio non trovato" });
    }

    if (ad.user_id !== userId) {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    // Verifica crediti
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (!profile || (profile.credits || 0) < credits) {
      return res.status(402).json({ error: "Crediti insufficienti" });
    }

    // Calcola date
    const now = new Date();
    const endAt = new Date(now.getTime() + duration_days * 24 * 60 * 60 * 1000);

    // Aggiorna annuncio
    const { data: updatedAd, error: updateError } = await supabase
      .from("ads")
      .update({
        is_premium: type === "premium",
        is_sponsored: type === "sponsored" || type === "vetrina",
        boost_type: type,
        boost_start_at: now.toISOString(),
        boost_end_at: endAt.toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: "Errore boost annuncio" });
    }

    // Scala crediti
    await supabase
      .from("profiles")
      .update({ credits: (profile.credits || 0) - credits })
      .eq("id", userId);

    // Registra boost
    await supabase.from("ad_boosts").insert({
      ad_id: id,
      user_id: userId,
      type,
      duration_days,
      start_at: now.toISOString(),
      end_at: endAt.toISOString(),
      credits_used: credits,
    });

    res.json({ ad: updatedAd, message: "Boost applicato con successo" });
  } catch (error) {
    console.error("Boost ad error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

export default router;
