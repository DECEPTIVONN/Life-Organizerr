var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);

// api/index.ts
var import_express = __toESM(require("express"), 1);
var app = (0, import_express.default)();
app.use(import_express.default.json());
var getRedirectUri = (req) => {
  const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` : void 0);
  if (appUrl) {
    const cleanUrl = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
    return `${cleanUrl}/auth/callback`;
  }
  const host = req.get("host") || "localhost:3000";
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${protocol}://${host}/auth/callback`;
};
app.get("/api/auth/google/url", (req, res) => {
  const client_id = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || process.env.OAUTH_CLIENT_ID;
  if (!client_id) {
    return res.status(400).json({
      error: "Google Client ID n\xE3o configurado no servidor. Por favor, configure as vari\xE1veis de ambiente."
    });
  }
  const clientRedirectUri = req.query.redirect_uri || getRedirectUri(req);
  const requestedScope = req.query.scope;
  const defaultScopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
  ];
  if (requestedScope === "calendar" || !requestedScope) {
    defaultScopes.push(
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    );
  }
  const scopes = requestedScope && requestedScope !== "calendar" ? requestedScope : defaultScopes.join(" ");
  const state = clientRedirectUri;
  const params = new URLSearchParams({
    client_id,
    redirect_uri: clientRedirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    state
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});
app.post("/api/auth/google/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: "Refresh token ausente." });
  }
  const client_id = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET;
  if (!client_id || !client_secret) {
    return res.status(500).json({ error: "Credenciais de cliente Google n\xE3o configuradas." });
  }
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id,
        client_secret,
        refresh_token,
        grant_type: "refresh_token"
      }).toString()
    });
    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      return res.status(tokenResponse.status).json({ error: `Falha ao renovar token: ${errText}` });
    }
    const tokens = await tokenResponse.json();
    res.json(tokens);
  } catch (err) {
    console.error("[Planner Server] Refresh token error:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, error, state } = req.query;
  if (error) {
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "GOOGLE_OAUTH_FAILURE", error: ${JSON.stringify(error)} }, "*");
              window.close();
            } else {
              window.location.href = "/";
            }
          </script>
          <p>Erro na autentica\xE7\xE3o: ${error}</p>
        </body>
      </html>
    `);
  }
  if (!code) {
    return res.status(400).send("C\xF3digo de autoriza\xE7\xE3o ausente.");
  }
  try {
    const client_id = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || process.env.OAUTH_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET;
    let redirectUri = getRedirectUri(req);
    if (state && typeof state === "string" && state.startsWith("http")) {
      redirectUri = state;
    }
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: client_id || "",
        client_secret: client_secret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      }).toString()
    });
    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${errText}`);
    }
    const tokens = await tokenResponse.json();
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    let profile = {};
    if (userInfoResponse.ok) {
      profile = await userInfoResponse.json();
    }
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: "GOOGLE_OAUTH_SUCCESS",
                tokens: ${JSON.stringify(tokens)},
                profile: ${JSON.stringify(profile)}
              }, "*");
              window.close();
            } else {
              window.location.href = "/";
            }
          </script>
          <p>Autenticado com sucesso! Esta janela fechar\xE1 sozinha.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("[Planner Server] OAuth callback error:", err);
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: "GOOGLE_OAUTH_FAILURE", error: ${JSON.stringify(err.message)} }, "*");
              window.close();
            }
          </script>
          <p>Erro de processamento: ${err.message}</p>
        </body>
      </html>
    `);
  }
});
app.get("/api/calendar/events", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de acesso ausente ou inv\xE1lido." });
  }
  const token = authHeader.split(" ")[1];
  const timeMin = req.query.timeMin || (/* @__PURE__ */ new Date()).toISOString();
  const timeMax = req.query.timeMax;
  try {
    const urlParams = new URLSearchParams({
      singleEvents: "true",
      maxResults: "250",
      timeMin
    });
    if (timeMax) {
      urlParams.append("timeMax", timeMax);
    }
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${urlParams.toString()}`;
    const response = await fetch(calendarUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Google Calendar API error: ${errText}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("[Planner Server] Calendar proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/calendar/events", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de acesso ausente ou inv\xE1lido." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Google Calendar API error: ${errText}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("[Planner Server] Create event error:", err);
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/calendar/events/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de acesso ausente ou inv\xE1lido." });
  }
  const token = authHeader.split(" ")[1];
  const eventId = req.params.id;
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Google Calendar API error: ${errText}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("[Planner Server] Update event error:", err);
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/calendar/events/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de acesso ausente ou inv\xE1lido." });
  }
  const token = authHeader.split(" ")[1];
  const eventId = req.params.id;
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Google Calendar API error: ${errText}` });
    }
    res.status(204).end();
  } catch (err) {
    console.error("[Planner Server] Delete event error:", err);
    res.status(500).json({ error: err.message });
  }
});
var api_default = app;

// server.ts
async function startServer() {
  const PORT = 3e3;
  const distPath = import_path.default.join(process.cwd(), "dist");
  const indexHtmlExists = import_fs.default.existsSync(import_path.default.join(distPath, "index.html"));
  const isProduction = process.env.NODE_ENV === "production";
  console.log(`[Planner Server] Starting up...`);
  console.log(`[Planner Server] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Planner Server] Is production: ${isProduction}`);
  if (isProduction) {
    if (!indexHtmlExists) {
      console.error("[Planner Server] ERROR: Starting in production mode but dist/index.html does not exist! Please run 'npm run build' first.");
    }
    console.log("[Planner Server] Running in PRODUCTION mode, serving static files from dist...");
    api_default.use(import_express2.default.static(distPath));
    api_default.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  } else {
    console.log("[Planner Server] Running in DEVELOPMENT mode, setting up Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    api_default.use(vite.middlewares);
  }
  api_default.listen(PORT, "0.0.0.0", () => {
    console.log(`[Planner Server] Server running and listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
