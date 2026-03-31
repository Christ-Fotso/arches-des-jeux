import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, products, discountCodes } from "@shared/schema";
import bcrypt from "bcryptjs";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  await db.insert(users).values([
    {
      email: "admin@beautesuisse.ch",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
    },
    {
      email: "user@beautesuisse.ch",
      password: await bcrypt.hash("user123", 10),
      name: "Test User",
      role: "USER",
    },
  ]);

  await db.insert(products).values([
    {
      titleFr: "Sérum de Luxe pour le Visage",
      titleDe: "Luxus-Gesichtsserum",
      titleEn: "Luxury Face Serum",
      descriptionFr: "Un sérum visage luxueux qui hydrate en profondeur et aide à réduire les signes de l'âge. Formulé avec des ingrédients premium pour une peau éclatante et rajeunie.",
      descriptionDe: "Ein luxuriöses Gesichtsserum, das tief hydratisiert und Zeichen der Hautalterung reduziert. Mit Premium-Inhaltsstoffen für strahlende, verjüngte Haut.",
      descriptionEn: "A luxurious face serum that deeply hydrates and helps reduce signs of aging. Formulated with premium ingredients for radiant, rejuvenated skin.",
      price: "89.90",
      quantityInStock: 50,
      imageUrl1: "/images/serum-1.png",
      imageUrl2: "/images/serum-2.png",
      altTextFr: "Sérum de luxe dans un flacon élégant",
      altTextDe: "Luxusserum in eleganter Flasche",
      altTextEn: "Luxury serum in elegant bottle",
    },
    {
      titleFr: "Shampooing Premium Cheveux",
      titleDe: "Premium-Haarshampoo",
      titleEn: "Premium Hair Shampoo",
      descriptionFr: "Shampooing professionnel pour des cheveux sains et brillants. Formule douce enrichie en nutriments essentiels.",
      descriptionDe: "Professionelles Shampoo für gesundes, glänzendes Haar. Sanfte Formel angereichert mit essentiellen Nährstoffen.",
      descriptionEn: "Professional shampoo for healthy, shiny hair. Gentle formula enriched with essential nutrients.",
      price: "45.50",
      quantityInStock: 100,
      imageUrl1: "/images/shampoo-1.png",
      imageUrl2: "/images/shampoo-2.png",
      altTextFr: "Flacon de shampooing premium noir",
      altTextDe: "Schwarze Premium-Shampooflasche",
      altTextEn: "Black premium shampoo bottle",
    },
    {
      titleFr: "Crème Hydratante Visage",
      titleDe: "Feuchtigkeitscreme Gesicht",
      titleEn: "Face Moisturizer Cream",
      descriptionFr: "Crème hydratante intensive pour une peau douce et nourrie. Protection 24h contre la déshydratation.",
      descriptionDe: "Intensive Feuchtigkeitscreme für weiche, genährte Haut. 24-Stunden-Schutz vor Austrocknung.",
      descriptionEn: "Intensive moisturizing cream for soft, nourished skin. 24-hour protection against dehydration.",
      price: "125.00",
      quantityInStock: 75,
      imageUrl1: "/images/moisturizer-1.png",
      imageUrl2: "/images/moisturizer-2.png",
      altTextFr: "Pot de crème hydratante blanc et or",
      altTextDe: "Weiß-goldener Feuchtigkeitscreme-Tiegel",
      altTextEn: "White and gold moisturizer jar",
    },
    {
      titleFr: "Rouge à Lèvres Luxe",
      titleDe: "Luxus-Lippenstift",
      titleEn: "Luxury Lipstick",
      descriptionFr: "Rouge à lèvres haute couture avec pigments intenses. Tenue longue durée et confort absolu.",
      descriptionDe: "Haute-Couture-Lippenstift mit intensiven Pigmenten. Langanhaltend und absoluter Komfort.",
      descriptionEn: "Haute couture lipstick with intense pigments. Long-lasting wear and absolute comfort.",
      price: "38.90",
      quantityInStock: 120,
      imageUrl1: "/images/lipstick-1.png",
      imageUrl2: "/images/lipstick-2.png",
      altTextFr: "Rouge à lèvres dans un étui doré",
      altTextDe: "Lippenstift in goldenem Etui",
      altTextEn: "Lipstick in gold case",
    },
    {
      titleFr: "Palette Fards à Paupières",
      titleDe: "Lidschatten-Palette",
      titleEn: "Eye Shadow Palette",
      descriptionFr: "Palette de fards à paupières avec 12 teintes harmonieuses. Texture soyeuse et pigmentation exceptionnelle.",
      descriptionDe: "Lidschatten-Palette mit 12 harmonischen Farbtönen. Seidige Textur und außergewöhnliche Pigmentierung.",
      descriptionEn: "Eye shadow palette with 12 harmonious shades. Silky texture and exceptional pigmentation.",
      price: "67.50",
      quantityInStock: 60,
      imageUrl1: "/images/eyeshadow-1.png",
      imageUrl2: "/images/eyeshadow-1.png",
      altTextFr: "Palette de maquillage tons neutres",
      altTextDe: "Make-up-Palette in neutralen Tönen",
      altTextEn: "Neutral tones makeup palette",
    },
    {
      titleFr: "Sérum Anti-Âge Premium",
      titleDe: "Premium Anti-Aging-Serum",
      titleEn: "Premium Anti-Aging Serum",
      descriptionFr: "Sérum anti-âge concentré aux actifs puissants. Réduit visiblement rides et ridules.",
      descriptionDe: "Konzentriertes Anti-Aging-Serum mit wirksamen Inhaltsstoffen. Reduziert sichtbar Falten und feine Linien.",
      descriptionEn: "Concentrated anti-aging serum with powerful actives. Visibly reduces wrinkles and fine lines.",
      price: "149.00",
      quantityInStock: 40,
      imageUrl1: "/images/serum-1.png",
      imageUrl2: "/images/serum-2.png",
      altTextFr: "Sérum anti-âge premium",
      altTextDe: "Premium Anti-Aging-Serum",
      altTextEn: "Premium anti-aging serum",
    },
  ]);

  await db.insert(discountCodes).values([
    {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: "10",
      isSingleUse: false,
      isActive: true,
    },
    {
      code: "SUMMER20",
      type: "PERCENTAGE",
      value: "20",
      isSingleUse: false,
      isActive: true,
    },
    {
      code: "FIRSTORDER",
      type: "FIXED",
      value: "15",
      isSingleUse: true,
      isActive: true,
    },
  ]);

  console.log("Database seeded successfully!");
  await sql.end();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("Seed failed!", err);
  await sql.end();
  process.exit(1);
});
