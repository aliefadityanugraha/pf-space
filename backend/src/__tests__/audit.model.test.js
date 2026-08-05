import { describe, it, expect } from 'vitest';
import { AuditLog } from '../models/AuditLog.js';

describe('AuditLog model', () => {
  it('should only set created_at on insert without requiring updated_at', () => {
    const auditLog = new AuditLog();

    auditLog.$beforeInsert();

    expect(auditLog.created_at).toBeDefined();
    expect(auditLog.updated_at).toBeUndefined();
  });
});
