import express from "express";
import { createServer as createViteServer } from "vite";
import { getSessions, saveSession } from "./src/services/db";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
  });

  // Auth middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies.token;
    console.log(`Auth check for ${req.url}. Token present: ${!!token}`);
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      console.log(`User authenticated: ${(req as any).user.id}`);
      next();
    } catch (e) {
      console.error("Auth failed:", e);
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- Auth Routes ---
  app.post("/api/auth/phone", (req, res) => {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: "Phone required" });
      return;
    }
    // In a real app, verify OTP here. For this prototype, we log them in.
    const sessionToken = jwt.sign({ id: phone, phone }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", sessionToken, {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({ user: (req as any).user });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token", { secure: true, sameSite: "none", httpOnly: true });
    res.json({ success: true });
  });

  // --- API routes ---
  app.get("/api/sessions", requireAuth, (req, res) => {
    try {
      const sessions = getSessions((req as any).user.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/sessions", requireAuth, (req, res) => {
    try {
      const session = req.body;
      console.log(`Saving session for user ${ (req as any).user.id }:`, session.id);
      saveSession((req as any).user.id, session);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving session:", error);
      res.status(500).json({ error: "Failed to save session" });
    }
  });

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Debug route
  app.get("/api/debug", (req, res) => {
    const dbPath = path.resolve(process.cwd(), "data/database.sqlite");
    res.json({
      nodeEnv: process.env.NODE_ENV,
      cwd: process.cwd(),
      distExists: fs.existsSync(path.resolve(process.cwd(), "dist")),
      indexExists: fs.existsSync(path.resolve(process.cwd(), "dist/index.html")),
      dbExists: fs.existsSync(dbPath),
      dbSize: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0,
    });
  });

  // Vite middleware for development
  // In the shared link environment, we want to force production if dist exists
  const distPath = path.resolve(process.cwd(), "dist");
  const hasDist = fs.existsSync(distPath);
  const isProduction = process.env.NODE_ENV === "production" || (hasDist && process.env.NODE_ENV !== "development");
  
  if (!isProduction) {
    console.log("Starting in development mode with Vite middleware...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Failed to start Vite server:", e);
    }
  } else {
    console.log("Starting in production mode, serving from dist...");
    console.log(`Dist path: ${distPath}`);
    
    if (hasDist) {
      console.log("Dist directory found.");
      app.use(express.static(distPath));
      
      // Catch-all route for client-side routing
      app.get("*", (req, res) => {
        // Skip API routes
        if (req.url.startsWith("/api/")) {
          return res.status(404).json({ error: "API route not found" });
        }
        
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          console.error(`index.html not found at ${indexPath}`);
          res.status(404).send("Application not initialized (index.html missing)");
        }
      });
    } else {
      console.error(`Dist directory NOT found at ${distPath}`);
      app.get("*", (req, res) => {
        res.status(500).send("Production build missing. Please run build first.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
