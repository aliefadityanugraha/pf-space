import { settingService } from '../services/setting.service.js';
import { ApiResponse } from '../lib/response.js';

class SettingController {
  async getPublicSettings(req, reply) {
    const settings = await settingService.getSettings(false);
    return ApiResponse.success(reply, settings, 'Public settings retrieved');
  }

  async getAllSettings(req, reply) {
    const settings = await settingService.getSettings(true);
    return ApiResponse.success(reply, settings, 'All settings retrieved');
  }

  async getSettingByKey(req, reply) {
    const { key } = req.params;
    const setting = await settingService.getSettingByKey(key, true);
    if (!setting) {
      return ApiResponse.notFound(reply, 'Setting not found');
    }
    return ApiResponse.success(reply, setting, 'Setting retrieved');
  }

  async updateSetting(req, reply) {
    const { key } = req.params;
    const data = req.body;
    await settingService.updateSetting(key, data);
    return ApiResponse.success(reply, null, 'Setting updated successfully');
  }
}

export const settingController = new SettingController();
