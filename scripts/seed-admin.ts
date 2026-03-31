import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "../shared/schema";
import bcrypt from "bcryptjs";
import fs from "fs";
import "dotenv/config";

async function seedAdmin() {
  console.log("Seeding admin user...");

  let databaseUrl = process.env.DATABASE_URL;
  const secretPath = "/run/secrets/db_password";

  if (fs.existsSync(secretPath)) {
    const dbPassword = fs.readFileSync(secretPath, "utf8").trim();
    databaseUrl = `postgresql://arches_user:${dbPassword}@postgres:5432/arches_des_jeux`;
  }

  if (!databaseUrl) {
    // Fallback for local development if no secret or env var
    databaseUrl = "postgresql://arches_user:beaute_pass@localhost:5432/arches_des_jeux";
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client);

  const adminEmail = process.env.ADMIN_EMAIL || "larchedesjeux@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "password123";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  try {
    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      name: "Admin",
      role: "ADMIN",
    });
    console.log(`Admin user ${adminEmail} created successfully!`);
  } catch (error: any) {
    if (error.code === '23505') {
      console.log(`Admin user ${adminEmail} already exists.`);
    } else {
      console.error("Error seeding admin:", error);
    }
  } finally {
    await client.end();
  }
}

seedAdmin();
