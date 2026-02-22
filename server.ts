import express from "express";
import { createServer as createViteServer } from "vite";
import { getSessions, saveSession } from "./src/services/db";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      next();
    } catch (e) {
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
      saveSession((req as any).user.id, session);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving session:", error);
      res.status(500).json({ error: "Failed to save session" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
