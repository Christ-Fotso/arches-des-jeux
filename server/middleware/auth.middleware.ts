import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { UserRepository } from "../repositories/user.repository";

const authService = new AuthService(new UserRepository());

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // Proceed without setting req.user
  }

  const token = authHeader.substring(7);

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
  } catch (error) {
    // If token is invalid, just ignore it and continue as guest
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}
