import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";

/**
 * Configuration Helmet pour headers de sécurité HTTP
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://www.gstatic.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "https://js.stripe.com", "https://www.gstatic.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * Rate limiting global - Plus permissif en développement
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 2000 : 10000, // 10000 requêtes en dev, 2000 en prod (x20)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting strict pour l'authentification - 5 tentatives par 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 tentatives max (x20)
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true, // Ne compte que les échecs
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting pour les uploads - 10 uploads par heure
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 200, // 200 uploads max (x20)
  message: "Too many uploads, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Protection contre HTTP Parameter Pollution
 */
export const hppProtection = hpp();

/**
 * Middleware pour désactiver les logs en production
 */
export function disableLogsInProduction() {
  if (process.env.NODE_ENV === "production") {
    console.log = () => { };
    console.debug = () => { };
    console.info = () => { };
    // Garder console.error et console.warn pour les erreurs critiques
  }
}

/**
 * Middleware pour valider le type MIME des fichiers uploadés
 */
export function validateMimeType(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return next();
  }

  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      error: "Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.",
    });
  }

  next();
}

/**
 * Middleware pour sanitizer les logs (ne pas logger de données sensibles)
 */
export function sanitizeLog(data: any): string {
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "authorization",
    "cookie",
    "jwt",
    "apikey",
    "api_key",
  ];

  if (typeof data === "string") {
    return data.length > 100 ? data.slice(0, 100) + "..." : data;
  }

  if (typeof data === "object" && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {};

    for (const key in data) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof data[key] === "object") {
        sanitized[key] = sanitizeLog(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }

    return JSON.stringify(sanitized);
  }

  return String(data);
}
