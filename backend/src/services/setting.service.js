import { Setting } from '../models/Setting.js';

class SettingService {
  async getSettings(isAdmin = false) {
    const query = Setting.query();
    if (!isAdmin) {
      query.where('is_public', true);
    }
    return await query;
  }

  async getSettingByKey(key, isAdmin = false) {
    const query = Setting.query().where('key', key).first();
    if (!isAdmin) {
      query.where('is_public', true);
    }
    return await query;
  }

  async updateSetting(key, data) {
    const setting = await Setting.query().where('key', key).first();
    
    if (setting) {
      return await Setting.query()
        .patch({
          value: data.value !== undefined ? data.value : setting.value,
          description: data.description !== undefined ? data.description : setting.description,
          is_public: data.is_public !== undefined ? data.is_public : setting.is_public,
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        })
        .where('key', key);
    } else {
      return await Setting.query().insert({
        key,
        value: data.value,
        description: data.description,
        is_public: data.is_public || false
      });
    }
  }

  async getAnnouncement() {
    return await this.getSettingByKey('announcement_modal', true);
  }
}

export const settingService = new SettingService();
