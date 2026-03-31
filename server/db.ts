import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema";
import fs from "fs";
import path from "path";

// Connexion à la base de données (PostgreSQL)
// En production/Docker, on peut utiliser des secrets pour construire l'URL si elle n'est pas déjà présente.
let databaseUrl = process.env.DATABASE_URL;

const secretPath = "/run/secrets/db_password";
if (fs.existsSync(secretPath)) {
  const dbPassword = fs.readFileSync(secretPath, "utf8").trim();
  // Construction robuste de l'URL pour Docker Compose
  databaseUrl = `postgresql://arches_user:${dbPassword}@postgres:5432/arches_des_jeux`;
}

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set (or provided via Docker secret 'db_password'). Did you forget to provision a database?",
  );
}

const client = postgres(databaseUrl, {
  prepare: true, // Activer prepared statements pour sécurité et performance
  max: 10, // Maximum 10 connexions dans le pool
  idle_timeout: 20, // Fermer les connexions inactives après 20s
  connect_timeout: 10, // Timeout de connexion de 10s
});

export const db = drizzle(client, { schema });
