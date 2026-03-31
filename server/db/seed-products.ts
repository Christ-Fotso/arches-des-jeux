import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { products } from "@shared/schema";

// Construire DATABASE_URL à partir des variables d'environnement si DATABASE_URL n'est pas défini
const DATABASE_URL = process.env.DATABASE_URL || 
  `postgres://${process.env.POSTGRES_USER || "beaute"}:${process.env.POSTGRES_PASSWORD || "beaute_password"}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || "beaute_suisse"}`;

const sql = postgres(DATABASE_URL);
const db = drizzle(sql);

async function seedProducts() {
  console.log("Seeding products...");

  await db.insert(products).values([
    {
      titleFr: "Sérum Anti-Âge Premium",
      titleDe: "Premium Anti-Aging-Serum",
      titleEn: "Premium Anti-Aging Serum",
      descriptionFr: "Sérum anti-âge concentré aux actifs puissants. Réduit visiblement les rides et ridules. Formulé avec de l'acide hyaluronique et des peptides pour une peau ferme et éclatante.",
      descriptionDe: "Konzentriertes Anti-Aging-Serum mit wirksamen Inhaltsstoffen. Reduziert sichtbar Falten und feine Linien. Formuliert mit Hyaluronsäure und Peptiden für feste, strahlende Haut.",
      descriptionEn: "Concentrated anti-aging serum with powerful actives. Visibly reduces wrinkles and fine lines. Formulated with hyaluronic acid and peptides for firm, radiant skin.",
      price: "149.00",
      quantityInStock: 50,
      imageUrl1: "/images/1a.jpg",
      imageUrl2: "/images/1b.jpg",
      altTextFr: "Sérum anti-âge premium dans un flacon élégant",
      altTextDe: "Premium Anti-Aging-Serum in eleganter Flasche",
      altTextEn: "Premium anti-aging serum in elegant bottle",
    },
    {
      titleFr: "Crème Hydratante Intense 24h",
      titleDe: "Intensive 24h Feuchtigkeitscreme",
      titleEn: "Intensive 24h Moisturizing Cream",
      descriptionFr: "Crème hydratante intensive pour une peau douce et nourrie. Protection 24h contre la déshydratation. Texture légère et non grasse, adaptée à tous les types de peau.",
      descriptionDe: "Intensive Feuchtigkeitscreme für weiche, genährte Haut. 24-Stunden-Schutz vor Austrocknung. Leichte, nicht fettende Textur, geeignet für alle Hauttypen.",
      descriptionEn: "Intensive moisturizing cream for soft, nourished skin. 24-hour protection against dehydration. Light, non-greasy texture, suitable for all skin types.",
      price: "89.90",
      quantityInStock: 75,
      imageUrl1: "/images/2a.jpg",
      imageUrl2: "/images/2b.jpg",
      altTextFr: "Pot de crème hydratante blanc et or",
      altTextDe: "Weiß-goldener Feuchtigkeitscreme-Tiegel",
      altTextEn: "White and gold moisturizer jar",
    },
    {
      titleFr: "Masque Purifiant Argile Verte",
      titleDe: "Reinigende Grüntonmaske",
      titleEn: "Purifying Green Clay Mask",
      descriptionFr: "Masque purifiant à l'argile verte pour éliminer les impuretés et resserrer les pores. Idéal pour les peaux mixtes à grasses. Application 10-15 minutes.",
      descriptionDe: "Reinigende Grüntonmaske zur Beseitigung von Unreinheiten und Porenverfeinerung. Ideal für Misch- bis fettige Haut. Anwendung 10-15 Minuten.",
      descriptionEn: "Purifying green clay mask to eliminate impurities and tighten pores. Ideal for combination to oily skin. Apply for 10-15 minutes.",
      price: "45.50",
      quantityInStock: 60,
      imageUrl1: "/images/3a.jpg",
      imageUrl2: "/images/3b.jpg",
      altTextFr: "Pot de masque argile verte",
      altTextDe: "Grüntonmaske-Tiegel",
      altTextEn: "Green clay mask jar",
    },
    {
      titleFr: "Sérum Vitamine C Éclat",
      titleDe: "Vitamin C Glanz-Serum",
      titleEn: "Vitamin C Brightening Serum",
      descriptionFr: "Sérum à la vitamine C pour un teint éclatant et uniforme. Réduit les taches pigmentaires et illumine la peau. Formule légère et rapidement absorbée.",
      descriptionDe: "Vitamin C Serum für strahlenden, gleichmäßigen Teint. Reduziert Pigmentflecken und erhellt die Haut. Leichte, schnell einziehende Formel.",
      descriptionEn: "Vitamin C serum for radiant, even complexion. Reduces dark spots and brightens skin. Light, fast-absorbing formula.",
      price: "79.90",
      quantityInStock: 80,
      imageUrl1: "/images/4a.jpg",
      imageUrl2: "/images/4b.jpg",
      altTextFr: "Flacon de sérum vitamine C",
      altTextDe: "Vitamin C Serum-Flasche",
      altTextEn: "Vitamin C serum bottle",
    },
    {
      titleFr: "Démaquillant Biphasé Doux",
      titleDe: "Sanftes Zweiphasen-Reinigungsmittel",
      titleEn: "Gentle Biphasic Makeup Remover",
      descriptionFr: "Démaquillant biphasé pour un nettoyage en profondeur. Élimine même le maquillage waterproof. Formule douce pour les yeux sensibles. Sans parfum.",
      descriptionDe: "Zweiphasen-Reinigungsmittel für gründliche Reinigung. Entfernt auch wasserfestes Make-up. Sanfte Formel für empfindliche Augen. Parfümfrei.",
      descriptionEn: "Biphasic makeup remover for deep cleansing. Removes even waterproof makeup. Gentle formula for sensitive eyes. Fragrance-free.",
      price: "32.90",
      quantityInStock: 100,
      imageUrl1: "/images/5a.jpg",
      imageUrl2: "/images/5b.jpg",
      altTextFr: "Flacon de démaquillant biphasé",
      altTextDe: "Zweiphasen-Reinigungsmittel-Flasche",
      altTextEn: "Biphasic makeup remover bottle",
    },
    {
      titleFr: "Palette Fards à Paupières 12 Teintes",
      titleDe: "Lidschatten-Palette 12 Farbtöne",
      titleEn: "Eye Shadow Palette 12 Shades",
      descriptionFr: "Palette de fards à paupières avec 12 teintes harmonieuses. Texture soyeuse et pigmentation exceptionnelle. Finition matte et satinée pour des looks variés.",
      descriptionDe: "Lidschatten-Palette mit 12 harmonischen Farbtönen. Seidige Textur und außergewöhnliche Pigmentierung. Matt und seidig für vielfältige Looks.",
      descriptionEn: "Eye shadow palette with 12 harmonious shades. Silky texture and exceptional pigmentation. Matte and satin finish for varied looks.",
      price: "67.50",
      quantityInStock: 45,
      imageUrl1: "/images/6a.jpg",
      imageUrl2: "/images/6b.jpg",
      altTextFr: "Palette de maquillage tons neutres",
      altTextDe: "Make-up-Palette in neutralen Tönen",
      altTextEn: "Neutral tones makeup palette",
    },
    {
      titleFr: "Rouge à Lèvres Longue Tenue",
      titleDe: "Langanhaltender Lippenstift",
      titleEn: "Long-Lasting Lipstick",
      descriptionFr: "Rouge à lèvres haute couture avec pigments intenses. Tenue longue durée jusqu'à 12h et confort absolu. Formule hydratante et non désséchante.",
      descriptionDe: "Haute-Couture-Lippenstift mit intensiven Pigmenten. Langanhaltend bis zu 12 Stunden und absoluter Komfort. Feuchtigkeitsspendende, nicht austrocknende Formel.",
      descriptionEn: "Haute couture lipstick with intense pigments. Long-lasting up to 12 hours and absolute comfort. Hydrating, non-drying formula.",
      price: "38.90",
      quantityInStock: 120,
      imageUrl1: "/images/7a.jpg",
      imageUrl2: "/images/7b.jpg",
      altTextFr: "Rouge à lèvres dans un étui doré",
      altTextDe: "Lippenstift in goldenem Etui",
      altTextEn: "Lipstick in gold case",
    },
    {
      titleFr: "Mascara Volume Extrême",
      titleDe: "Extremes Volumen-Mascara",
      titleEn: "Extreme Volume Mascara",
      descriptionFr: "Mascara volume extrême pour des cils ultra-denses et allongés. Résistant à l'eau et aux larmes. Brosse courbée pour un recourbement parfait.",
      descriptionDe: "Extremes Volumen-Mascara für ultra-dichte, verlängerte Wimpern. Wasser- und tränenfest. Gebogene Bürste für perfekte Krümmung.",
      descriptionEn: "Extreme volume mascara for ultra-dense, lengthened lashes. Water and tear resistant. Curved brush for perfect curl.",
      price: "42.50",
      quantityInStock: 90,
      imageUrl1: "/images/8a.jpg",
      imageUrl2: "/images/8b.jpg",
      altTextFr: "Mascara volume extrême",
      altTextDe: "Extremes Volumen-Mascara",
      altTextEn: "Extreme volume mascara",
    },
    {
      titleFr: "Shampooing Réparateur Cheveux Abîmés",
      titleDe: "Reparatives Shampoo für geschädigtes Haar",
      titleEn: "Repairing Shampoo for Damaged Hair",
      descriptionFr: "Shampooing professionnel pour cheveux abîmés et colorés. Formule enrichie en kératine et huiles nourrissantes. Restaure la brillance et la douceur.",
      descriptionDe: "Professionelles Shampoo für geschädigtes und gefärbtes Haar. Formel angereichert mit Keratin und pflegenden Ölen. Stellt Glanz und Weichheit wieder her.",
      descriptionEn: "Professional shampoo for damaged and colored hair. Formula enriched with keratin and nourishing oils. Restores shine and softness.",
      price: "35.90",
      quantityInStock: 110,
      imageUrl1: "/images/9a.jpg",
      imageUrl2: "/images/9b.jpg",
      altTextFr: "Flacon de shampooing réparateur",
      altTextDe: "Reparatives Shampoo-Flasche",
      altTextEn: "Repairing shampoo bottle",
    },
    {
      titleFr: "Huile Visage Nourrissante",
      titleDe: "Nährendes Gesichtsöl",
      titleEn: "Nourishing Face Oil",
      descriptionFr: "Huile visage multi-nutritive aux huiles précieuses. Hydrate intensément et restaure la barrière cutanée. Texture légère, pénètre rapidement sans laisser de film gras.",
      descriptionDe: "Mehrfach nährendes Gesichtsöl mit wertvollen Ölen. Hydratisiert intensiv und stellt die Hautbarriere wieder her. Leichte Textur, zieht schnell ein ohne fettigen Film.",
      descriptionEn: "Multi-nourishing face oil with precious oils. Intensely hydrates and restores the skin barrier. Light texture, absorbs quickly without greasy film.",
      price: "95.00",
      quantityInStock: 55,
      imageUrl1: "/images/10a.jpg",
      imageUrl2: "/images/10b.jpg",
      altTextFr: "Flacon d'huile visage doré",
      altTextDe: "Goldene Gesichtsöl-Flasche",
      altTextEn: "Golden face oil bottle",
    },
  ]);

  console.log("✅ 10 products seeded successfully!");
  await sql.end();
  process.exit(0);
}

seedProducts().catch(async (err) => {
  console.error("❌ Seed failed!", err);
  await sql.end();
  process.exit(1);
});

