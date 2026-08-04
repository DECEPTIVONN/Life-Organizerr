import express from "express";
import path from "path";
import fs from "fs";
import compression from "compression";
import app from "./api/index";

async function startServer() {
  const PORT = 3000;

  const distPath = path.join(process.cwd(), "dist");
  const indexHtmlExists = fs.existsSync(path.join(distPath, "index.html"));
  
  // Decide production mode based strictly on NODE_ENV
  const isProduction = process.env.NODE_ENV === "production";

  console.log(`[Planner Server] Starting up...`);
  console.log(`[Planner Server] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Planner Server] Is production: ${isProduction}`);

  if (isProduction) {
    app.use(compression());
    if (!indexHtmlExists) {
      console.error("[Planner Server] ERROR: Starting in production mode but dist/index.html does not exist! Please run 'npm run build' first.");
    }
    console.log("[Planner Server] Running in PRODUCTION mode, serving static files with aggressive caching...");

    // Immutable cache for fingerprinted static assets in /assets (JS, CSS, images)
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
      etag: true
    }));

    // Standard static file serving with cache headers
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
          // Do not cache index.html or service worker so app updates load immediately
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));

    app.get("*", (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("[Planner Server] Running in DEVELOPMENT mode, setting up Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Planner Server] Server running and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
