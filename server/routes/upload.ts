import { Router } from "express";
import multer from "multer";
import { supabase } from "../middleware/supabaseClient";
import { authMiddleware } from "../middleware/auth";
import type { AuthenticatedRequest } from "../types";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 5, // max 5 file
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Sono permessi solo file JPEG, PNG, WebP o GIF"));
    }
  },
});

// ========== UPLOAD PHOTOS ==========
router.post("/", authMiddleware, upload.array("photos", 5), async (req: AuthenticatedRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Nessun file caricato" });
    }

    const urls: string[] = [];
    const userId = req.user!.userId;

    for (const file of files) {
      const fileExt = file.mimetype.split("/")[1];
      const fileName = `ad-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("ad-photos")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ error: `Errore upload file: ${error.message}` });
      }

      const { data: publicUrl } = supabase.storage
        .from("ad-photos")
        .getPublicUrl(fileName);

      urls.push(publicUrl.publicUrl);
    }

    res.json({ urls, count: urls.length });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ========== DELETE PHOTO ==========
router.delete("/:filename", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user!.userId;

    // Verifica che il file appartenga all'utente
    if (filename.includes("/") || !filename.startsWith(`ad-${userId}-`)) {
      return res.status(403).json({ error: "Non autorizzato a eliminare questo file" });
    }

    const { error } = await supabase.storage
      .from("ad-photos")
      .remove([filename]);

    if (error) {
      return res.status(500).json({ error: "Errore eliminazione file" });
    }

    res.json({ message: "File eliminato con successo" });
  } catch (error) {
    console.error("Delete photo error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

export default router;
