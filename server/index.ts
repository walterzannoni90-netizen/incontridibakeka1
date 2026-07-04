import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRouter from "./routes/auth.js";
import adsRouter from "./routes/ads.js";
import paymentsRouter from "./routes/payments.js";
import uploadRouter from "./routes/upload.js";
import adminRouter from "./routes/admin.js";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://*.supabase.co", "https://api.stripe.com", "https://*.stripe.com"],
        imgSrc: ["'self'", "https:", "data:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "https:", "data:"],
      },
    },
  }));

  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }));

  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 200,
    message: { error: "Troppe richieste, riprova più tardi." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", generalLimiter);

  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 ora
    max: 10,
    message: { error: "Troppe tentativi di autenticazione. Riprova più tardi." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { error: "Limite upload raggiunto." },
  });
  app.use("/api/upload", uploadLimiter);

  // API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/ads", adsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/admin", adminRouter);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Serve static files
  const staticPath = process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Errore interno del server" });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`🚀 Server Incontri di Bakeka V2`);
    console.log(`📡 Porta: ${port}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 API: http://localhost:${port}/api`);
    console.log(`🏥 Health: http://localhost:${port}/api/health`);
  });
}

startServer().catch((error) => {
  console.error("❌ Errore avvio server:", error);
  process.exit(1);
});
