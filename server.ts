import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import digitalizeHandler from "./api/digitalize.ts";

// Initialize environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable large file uploads (crucial for images and large PDFs in base64)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Setup API digitalization endpoint
  app.post("/api/digitalize", (req, res) => {
    digitalizeHandler(req, res);
  });

  // Vite middleware integration for development / production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dev/Standalone Server running on http://localhost:${PORT}`);
  });
}

startServer();
