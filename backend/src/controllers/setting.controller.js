import { settingService } from '../services/setting.service.js';
import { ApiResponse } from '../lib/response.js';

class SettingController {
  async getPublicSettings(req, reply) {
    const settings = await settingService.getSettings(false);
    return ApiResponse.success(reply, settings, 'Pengaturan publik berhasil diambil');
  }

  async getAllSettings(req, reply) {
    const settings = await settingService.getSettings(true);
    return ApiResponse.success(reply, settings, 'Semua pengaturan berhasil diambil');
  }

  async getSettingByKey(req, reply) {
    const { key } = req.params;
    const setting = await settingService.getSettingByKey(key, true);
    if (!setting) {
      return ApiResponse.notFound(reply, 'Pengaturan tidak ditemukan');
    }
    return ApiResponse.success(reply, setting, 'Pengaturan berhasil diambil');
  }

  async updateSetting(req, reply) {
    const { key } = req.params;
    const data = req.body;
    await settingService.updateSetting(key, data);
    return ApiResponse.success(reply, null, 'Pengaturan berhasil diperbarui');
  }
}

export const settingController = new SettingController();
