import { db } from "../db";
import { siteSettings } from "@shared/schema";

async function seedSettings() {
  try {
    const existingSettings = await db.query.siteSettings.findFirst();
    
    if (!existingSettings) {
      await db.insert(siteSettings).values({
        defaultLanguage: "fr",
      });
      console.log("Site settings initialized with default language: fr");
    } else {
      console.log("Site settings already exist");
    }
  } catch (error) {
    console.error("Error seeding site settings:", error);
    throw error;
  }
}

seedSettings();
