/**
 * src/lib/audit.js
 * 
 * Utility to record administrative actions in the audit_logs table.
 */

import { AuditLog } from '../models/index.js';

/**
 * Record an administrative action
 * @param {object} params
 * @param {string} params.userId - ID of the admin performing the action
 * @param {string} params.action - Action name (e.g., DELETE_FILM, UPDATE_ROLE)
 * @param {string} params.targetType - Target type (e.g., film, user, category)
 * @param {string} params.targetId - ID of the target object
 * @param {object} params.details - Extra details (will be stringified)
 * @param {string} params.ipAddress - IP address of the requester
 * @returns {Promise<AuditLog>} The created log entry
 */
export async function recordAuditLog({ 
  userId, 
  action, 
  targetType, 
  targetId, 
  details = {}, 
  ipAddress = null 
}) {
  try {
    return await AuditLog.query().insert({
      user_id: userId,
      action: action,
      target_type: targetType,
      target_id: targetId?.toString(),
      details: typeof details === 'string' ? details : JSON.stringify(details),
      ip_address: ipAddress
    });
  } catch (err) {
    // Audit logging should not crash the main request
    console.error('CRITICAL: Failed to record audit log:', err);
    return null;
  }
}
