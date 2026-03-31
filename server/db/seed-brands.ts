import { db } from "../db";
import { brands } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedBrands() {
  try {
    console.log("🌱 Seeding brands...");

    const brandsToSeed = [
      {
        name: "MÜE",
        description: "Produits premium pour cheveux et corps"
      },
      {
        name: "NAPPY",
        description: "Produits spécialisés pour cheveux"
      }
    ];

    for (const brand of brandsToSeed) {
      const existing = await db.select().from(brands).where(eq(brands.name, brand.name));

      if (existing.length > 0) {
        console.log(`✅ Brand "${brand.name}" already exists`);
      } else {
        await db.insert(brands).values(brand);
        console.log(`✅ Brand "${brand.name}" created successfully!`);
      }
    }

    console.log("\n=== BRANDS SEEDED ===");
    console.log("✓ MÜE - Produits pour cheveux et corps");
    console.log("✓ NAPPY - Produits spécialisés pour cheveux");
    console.log("=====================\n");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding brands:", error);
    process.exit(1);
  }
}

seedBrands();
