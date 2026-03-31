import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import type { InsertUser, User } from "@shared/schema";
import fs from "fs";

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;

    // Lire JWT_SECRET depuis Docker secret si disponible
    const secretPath = "/run/secrets/jwt_secret";
    if (fs.existsSync(secretPath)) {
      this.jwtSecret = fs.readFileSync(secretPath, "utf8").trim();
    } else if (process.env.JWT_SECRET) {
      this.jwtSecret = process.env.JWT_SECRET;
    } else {
      throw new Error("JWT_SECRET environment variable or secret file is required");
    }
  }

  async register(data: InsertUser): Promise<{ user: Omit<User, "password">; token: string }> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      // Message générique pour éviter l'énumération d'emails
      throw new Error("Invalid credentials");
    }

    // Augmenter bcrypt rounds à 12 pour plus de sécurité
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    const token = this.generateToken(user);
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async login(email: string, password: string): Promise<{ user: Omit<User, "password">; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    const token = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  verifyToken(token: string): { userId: string; role: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string; role: string };
      return decoded;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, role: user.role },
      this.jwtSecret,
      { expiresIn: "1h" } // Réduit de 7d à 1h pour plus de sécurité
    );
  }
}
