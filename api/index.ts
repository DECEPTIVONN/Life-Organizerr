import express from "express";

const app = express();
app.use(express.json());

// Helper to construct exact redirect URI
const getRedirectUri = (req: express.Request) => {
  const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}` : undefined);
  if (appUrl) {
    const cleanUrl = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
    return `${cleanUrl}/auth/callback`;
  }
  const host = req.get("host") || "localhost:3000";
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${protocol}://${host}/auth/callback`;
};

// Google OAuth URL Generation
app.get("/api/auth/google/url", (req, res) => {
  const client_id = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || process.env.OAUTH_CLIENT_ID;
  if (!client_id) {
    return res.status(400).json({ 
      error: "Google Client ID não configurado no servidor. Por favor, configure as variáveis de ambiente." 
    });
  }

  const clientRedirectUri = (req.query.redirect_uri as string) || getRedirectUri(req);
  const requestedScope = req.query.scope as string;
  const defaultScopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
  ];

  if (requestedScope === "calendar") {
    defaultScopes.push(
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    );
  }

  const scopes = requestedScope && requestedScope !== "calendar" 
    ? requestedScope 
    : defaultScopes.join(" ");

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

// OAuth Callback Route
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
          <p>Erro na autenticação: ${error}</p>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send("Código de autorização ausente.");
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
        code: code as string,
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
          <p>Autenticado com sucesso! Esta janela fechará sozinha.</p>
        </body>
      </html>
    `);
  } catch (err: any) {
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

// Calendar Proxy Route
app.get("/api/calendar/events", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de acesso ausente ou inválido." });
  }

  const token = authHeader.split(" ")[1];
  const timeMin = (req.query.timeMin as string) || new Date().toISOString();
  const timeMax = req.query.timeMax as string;

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
  } catch (err: any) {
    console.error("[Planner Server] Calendar proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST to create Google Calendar event
app.post("/api/calendar/events", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de acesso ausente ou inválido." });
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
  } catch (err: any) {
    console.error("[Planner Server] Create event error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT to update Google Calendar event
app.put("/api/calendar/events/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de acesso ausente ou inválido." });
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
  } catch (err: any) {
    console.error("[Planner Server] Update event error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE to remove Google Calendar event
app.delete("/api/calendar/events/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de acesso ausente ou inválido." });
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
  } catch (err: any) {
    console.error("[Planner Server] Delete event error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default app;
