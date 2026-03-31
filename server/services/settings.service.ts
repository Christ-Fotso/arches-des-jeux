import { SettingsRepository } from "../repositories/settings.repository";
import type { SiteSettings, InsertSiteSettings } from "@shared/schema";

export class SettingsService {
  private settingsRepository: SettingsRepository;

  constructor(settingsRepository: SettingsRepository) {
    this.settingsRepository = settingsRepository;
  }

  async getSettings(): Promise<SiteSettings> {
    const settings = await this.settingsRepository.getSettings();
    if (!settings) {
      return await this.settingsRepository.updateSettings({ defaultLanguage: "fr" });
    }
    return settings;
  }

  async updateSettings(data: Partial<InsertSiteSettings>): Promise<SiteSettings> {
    return await this.settingsRepository.updateSettings(data);
  }
}
