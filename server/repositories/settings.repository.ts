import { db } from "../db";
import { siteSettings, type SiteSettings, type InsertSiteSettings } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export class SettingsRepository {
  async getSettings(): Promise<SiteSettings | undefined> {
    return await db.query.siteSettings.findFirst();
  }

  async updateSettings(data: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    const existingSettings = await this.getSettings();
    
    if (existingSettings) {
      const [updated] = await db
        .update(siteSettings)
        .set({ ...data, updatedAt: sql`NOW()` })
        .where(eq(siteSettings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(siteSettings).values(data).returning();
      return created;
    }
  }
}
