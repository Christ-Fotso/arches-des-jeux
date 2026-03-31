import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql as drizzleSql } from "drizzle-orm";
import { pgTable, text, decimal, integer, varchar } from "drizzle-orm/pg-core";

const products = pgTable("products", {
  id: varchar("id").primaryKey().default(drizzleSql`gen_random_uuid()`),
  titleFr: text("title_fr").notNull(),
  titleDe: text("title_de").notNull(),
  titleEn: text("title_en").notNull(),
  descriptionFr: text("description_fr").notNull(),
  descriptionDe: text("description_de").notNull(),
  descriptionEn: text("description_en").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantityInStock: integer("quantity_in_stock").notNull().default(0),
  imageUrl1: text("image_url_1").notNull(),
  imageUrl2: text("image_url_2").notNull(),
  altTextFr: text("alt_text_fr").notNull(),
  altTextDe: text("alt_text_de").notNull(),
  altTextEn: text("alt_text_en").notNull(),
});

// Lire la configuration comme dans server/db.ts
let databaseUrl = process.env.DATABASE_URL;
import fs from "fs";
const secretPath = "/run/secrets/db_password";
if (fs.existsSync(secretPath)) {
  const dbPassword = fs.readFileSync(secretPath, "utf8").trim();
  databaseUrl = `postgresql://arches_user:${dbPassword}@postgres:5432/arches_des_jeux`;
}

if (!databaseUrl) {
  // Fallback pour le développement local si DATABASE_URL n'est pas défini
  databaseUrl = "postgresql://arches_user:beaute_pass@localhost:5432/arches_des_jeux";
}

const client = postgres(databaseUrl);
const db = drizzle(client);

async function seed() {
  console.log("Seeding game with manual schema...");

  try {
    const existing = await db.select().from(products).where(drizzleSql`title_fr = 'C’est quoi le verset ?'`);
    if (existing.length > 0) {
      console.log("Game already seeded!");
      return;
    }

    await db.insert(products).values({
      titleFr: "C’est quoi le verset ?",
      titleDe: "Was ist der Vers?",
      titleEn: "What's the verse?",
      descriptionFr: "« C’est quoi le verset ? » est un jeu de 100 cartes éducatif et interactif conçu pour explorer la Bible de manière ludique. Chaque carte propose une question sur un thème biblique (histoire, personnage, enseignement), suivie de sa réponse claire et du verset associé. Parfait pour les familles, les groupes de jeunes ou les écoles du dimanche.",
      descriptionDe: "« Was ist der Vers? » ist ein lehrreiches et interaktives Kartenspiel mit 100 Karten, um die Bibel spielerisch zu entdecken. Jede Karte bietet eine Frage zu einem biblischen Thema, gefolgt von einer klaren Antwort und dem zugehörigen Vers.",
      descriptionEn: "« What’s the verse? » is an educational and interactive 100-card game designed to explore the Bible in a fun way. Each card features a question on a biblical theme, followed by a clear answer and the associated verse.",
      price: "19.99",
      quantityInStock: 100,
      imageUrl1: "/uploads/game_box.png",
      imageUrl2: "/uploads/game_cards.png",
      altTextFr: "Boîte du jeu C'est quoi le verset ?",
      altTextDe: "Spielschachtel Was ist der Vers?",
      altTextEn: "Game box What's the verse?",
    });

    console.log("Game seeded successfully!");
  } catch (error) {
    console.error("Error seeding game:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

seed().catch(async (err) => {
  console.error("Seed failed!", err);
  await client.end();
  process.exit(1);
});
