/**
 * src/services/report.service.js
 * 
 * Service for reporting inappropriate content.
 */

import { Report, BaseModel } from '../models/index.js';
import { PAGINATION } from '../config/constants.js';

export class ReportService {
  /**
   * Submit a new report
   * @param {object} data - Report data
   * @returns {Promise<Report>}
   */
  async create(data) {
    return Report.query().insert(data);
  }

  /**
   * Get all reports with optional filtering
   * @param {object} options - Pagination and filter options
   * @returns {Promise<object>}
   */
  async getAll(options = {}) {
    const { 
      page = PAGINATION.DEFAULT_PAGE, 
      limit = PAGINATION.DEFAULT_LIMIT,
      status, 
      target_type 
    } = options;

    const query = Report.query()
      .withGraphFetched('reporter(selectBasic)')
      .modifiers(BaseModel.defaultModifiers)
      .orderBy('created_at', 'desc');

    if (status) {
      query.where('status', status);
    }

    if (target_type) {
      query.where('target_type', target_type);
    }

    const offset = (page - 1) * limit;
    
    // We need target details based on target_type
    // For simplicity, we just return the reports and handle hydration in controller or frontend
    const result = await query.page(page - 1, limit);

    return {
      reports: result.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  }

  /**
   * Update report status and add admin notes
   * @param {number} id - Report ID
   * @param {object} data - Update data (status, admin_notes)
   * @returns {Promise<Report>}
   */
  async updateStatus(id, data) {
    return Report.query().patchAndFetchById(id, {
      status: data.status,
      admin_notes: data.admin_notes
    });
  }
}

export const reportService = new ReportService();
