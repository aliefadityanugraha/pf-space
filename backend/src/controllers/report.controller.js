/**
 * src/controllers/report.controller.js
 * 
 * Controller for handling content reporting.
 */

import { reportService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';
import { ROLES } from '../config/constants.js';
import { recordAuditLog } from '../lib/audit.js';

export class ReportController {
  /**
   * Protected: Submit a report
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async create(request, reply) {
    const { target_type, target_id, reason, description } = request.body;

    const report = await reportService.create({
      user_id: request.user.id,
      target_type,
      target_id,
      reason,
      description
    });

    return ApiResponse.success(reply, report, 'Laporan berhasil dikirim. Terima kasih telah membantu menjaga komunitas.', 201);
  }

  /**
   * Admin: List all reports
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getAll(request, reply) {
    try {
      const fs = await import('fs');
      fs.appendFileSync('manual-debug.log', `[${new Date().toISOString()}] GET /api/reports query: ${JSON.stringify(request.query)}\n`);
      const { page, limit, status, target_type } = request.query;

      const result = await reportService.getAll({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        status,
        target_type
      });

      return ApiResponse.success(
        reply, 
        result.reports, 
        'Reports retrieved successfully', 
        200, 
        result.pagination
      );
    } catch (err) {
      request.log.error(err);
      return ApiResponse.error(reply, err.message || 'Gagal memuat laporan', 500);
    }
  }

  /**
   * Admin: Process a report
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async updateStatus(request, reply) {
    const { id } = request.params;
    const { status, admin_notes } = request.body;

    const updated = await reportService.updateStatus(id, { status, admin_notes });

    // Audit Log
    await recordAuditLog({
      userId: request.user.id,
      action: 'PROCESS_REPORT',
      targetType: 'report',
      targetId: id,
      details: { status, admin_notes },
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, updated, 'Laporan berhasil diproses');
  }
}

export const reportController = new ReportController();
