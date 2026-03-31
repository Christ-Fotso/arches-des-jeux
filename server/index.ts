import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import {
  helmetConfig,
  globalRateLimiter,
  hppProtection,
  disableLogsInProduction,
  sanitizeLog,
} from "./middleware/security.middleware";

const app = express();

// Désactiver les logs en production (SÉCURITÉ)
disableLogsInProduction();

// Middlewares de sécurité
app.use(helmetConfig); // Headers de sécurité HTTP
app.use(globalRateLimiter); // Rate limiting global
app.use(hppProtection); // Protection HTTP Parameter Pollution

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
  limit: '10mb', // Limite de taille de payload
}));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      // Sanitizer les logs pour ne pas exposer de données sensibles
      if (capturedJsonResponse && process.env.NODE_ENV === "development") {
        const sanitized = sanitizeLog(capturedJsonResponse);
        logLine += ` :: ${sanitized}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Logger l'erreur de manière sécurisée
    if (process.env.NODE_ENV === "development") {
      console.error("Error:", err);
    } else {
      // En production, ne logger que le message, pas la stack trace
      console.error(`Error ${status}: ${message}`);
    }

    res.status(status).json({ message });
    // NE PAS throw après avoir envoyé la réponse
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
