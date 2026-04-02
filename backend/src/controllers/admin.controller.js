/**
 * src/controllers/admin.controller.js
 * 
 * Controller for administrative tasks and dashboard statistics.
 */

import { User } from '../models/User.js';
import { Film } from '../models/Film.js';
import { Category } from '../models/Category.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiResponse } from '../lib/response.js';
import { getStorageStats, UPLOAD_DIR } from '../lib/upload.js';
import archiver from 'archiver';
import extractZip from 'extract-zip';
import fs from 'fs';
import path from 'path';

export class AdminController {
  /**
   * Get administrative audit logs
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getAuditLogs(request, reply) {
    try {
      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 20;

      const logs = await AuditLog.query()
        .withGraphFetched('user(selectBasic)')
        .modifiers(AuditLog.defaultModifiers)
        .orderBy('created_at', 'desc')
        .page(page - 1, limit);

      return ApiResponse.success(reply, logs.results, 'Audit logs retrieved', 200, {
        total: logs.total,
        page,
        limit,
        totalPages: Math.ceil(logs.total / limit)
      });
    } catch (error) {
      request.log.error(error);
      return ApiResponse.error(reply, error.message || 'Gagal mengambil log audit', 500);
    }
  }

  /**
   * Get storage usage statistics
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getStorageStats(request, reply) {
    try {
      const stats = await getStorageStats();
      return ApiResponse.success(reply, stats);
    } catch (error) {
      request.log.error(error);
      return ApiResponse.error(reply, 'Gagal mengambil statistik penyimpanan');
    }
  }

  /**
   * Fetch aggregate statistics and recent activity for the admin dashboard
   * @param {import('fastify').FastifyRequest} request - Fastify request object
   * @param {import('fastify').FastifyReply} reply - Fastify reply object
   * @returns {Promise<import('fastify').FastifyReply>} Standard API response with stats
   */
  async getDashboardStats(request, reply) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalFilms,
        newFilms,
        totalUsers,
        newUsers,
        pendingFilms,
        totalCategories,
        newCategories,
        recentPendingFilms,
        recentActivities
      ] = await Promise.all([
        Film.query().resultSize(),
        Film.query().where('created_at', '>=', thirtyDaysAgo).resultSize(),
        User.query().resultSize(),
        User.query().where('createdAt', '>=', thirtyDaysAgo).resultSize(),
        Film.query().where('status', 'pending').resultSize(),
        Category.query().resultSize(),
        Category.query().where('created_at', '>=', thirtyDaysAgo).resultSize(),
        Film.query()
          .where('status', 'pending')
          .withGraphFetched('creator')
          .orderBy('created_at', 'desc')
          .limit(5),
        Film.query()
          .withGraphFetched('creator')
          .orderBy('updated_at', 'desc')
          .limit(5)
      ]);

      return ApiResponse.success(reply, {
        totalFilms,
        newFilms,
        totalUsers,
        newUsers,
        pendingFilms,
        totalCategories,
        newCategories,
        recentPendingFilms,
        recentActivities: recentActivities.map(f => ({
          user: f.creator?.name || 'Unknown',
          action: f.status === 'published' ? 'published' : 'uploaded',
          target: f.judul,
          time: f.updated_at
        }))
      });
    } catch (error) {
      request.log.error(error);
      return ApiResponse.error(reply, 'Internal server error while fetching dashboard stats');
    }
  }

  /**
   * Generate database and files backup
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async generateBackup(request, reply) {
    try {
      // Ensure backup directory exists
      const backupDir = path.join(process.cwd(), 'backup');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const sqlFileName = `dump_${timestamp}.sql`;
      const sqlFilePath = path.join(backupDir, sqlFileName);
      const zipFileName = `backup_${timestamp}.zip`;
      const zipFilePath = path.join(backupDir, zipFileName);

      // Dump DB using system mysqldump CLI (safer than npm mysqldump package)
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);

      const dbHost = process.env.DB_HOST || 'localhost';
      const dbPort = String(process.env.DB_PORT || 3306);
      const dbUser = process.env.DB_USER || 'root';
      const dbPass = process.env.DB_PASSWORD || '';
      const dbName = process.env.DB_NAME || 'film';

      const args = [
        `--host=${dbHost}`,
        `--port=${dbPort}`,
        `--user=${dbUser}`,
        `--result-file=${sqlFilePath}`,
        '--single-transaction', // Consistent snapshot without table locks
        '--no-tablespaces',
        dbName
      ];

      // Pass password via env var to avoid shell exposure
      const env = { ...process.env };
      if (dbPass) env.MYSQL_PWD = dbPass;

      try {
        await execFileAsync('mysqldump', args, { env });
      } catch (dumpErr) {
        // Provide helpful error if mysqldump CLI not in PATH
        if (dumpErr.code === 'ENOENT') {
          return ApiResponse.error(reply, 'mysqldump CLI tidak ditemukan di PATH server. Pastikan MySQL client tools terinstall.', 500);
        }
        throw dumpErr;
      }

      // Create Zip
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      const archivePromise = new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
      });

      archive.pipe(output);
      archive.file(sqlFilePath, { name: sqlFileName });
      archive.directory(UPLOAD_DIR, 'uploads');
      await archive.finalize();
      await archivePromise;

      // Clean up the .sql file since it's already in the .zip
      fs.unlinkSync(sqlFilePath);

      // Check if user requested download via query param ?download=true
      const download = request.query.download === 'true';

      if (download) {
        const fileStream = fs.createReadStream(zipFilePath);
        reply.header('Content-Type', 'application/zip');
        reply.header('Content-Disposition', `attachment; filename="${zipFileName}"`);
        return reply.send(fileStream);
      } else {
        return ApiResponse.success(reply, { filename: zipFileName }, 'Backup berhasil dibuat dan disimpan di server');
      }
    } catch (error) {
      request.log.error(error);
      return ApiResponse.error(reply, error.message || 'Gagal membuat backup', 500);
    }
  }

  /**
   * Restore database and files from uploaded zip
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async restoreBackup(request, reply) {
    try {
      const data = await request.file();
      if (!data) {
        return ApiResponse.error(reply, 'File backup tidak ditemukan', 400);
      }

      const tempDir = path.join(process.cwd(), 'temp-restore');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tempDir, { recursive: true });

      const zipPath = path.join(tempDir, 'backup.zip');
      const { pipeline } = await import('stream');
      const { promisify } = await import('util');
      const pump = promisify(pipeline);
      await pump(data.file, fs.createWriteStream(zipPath));

      await extractZip(zipPath, { dir: tempDir });

      // Find the .sql file
      const files = fs.readdirSync(tempDir);
      const sqlFile = files.find(f => f.endsWith('.sql'));

      if (sqlFile) {
        const sqlFilePath = path.join(tempDir, sqlFile);
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbUser = process.env.DB_USER || 'root';
        const dbPass = process.env.DB_PASSWORD || '';
        const dbName = process.env.DB_NAME || 'film';
        const dbPort = process.env.DB_PORT || '3306';

        const passStr = dbPass ? `-p"${dbPass}"` : '';
        // Note: Using child_process exec to run mysql CLI. This requires mysql to be in PATH!
        const cmd = `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} ${passStr} ${dbName} < "${sqlFilePath}"`;

        const { exec } = await import('child_process');
        const execPromise = promisify(exec);
        await execPromise(cmd);
      }

      // Restore uploads folder
      const uploadsExtractDir = path.join(tempDir, 'uploads');
      if (fs.existsSync(uploadsExtractDir)) {
        fs.cpSync(uploadsExtractDir, UPLOAD_DIR, { recursive: true, force: true });
      }

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });

      return ApiResponse.success(reply, null, 'Backup berhasil direstore!');
    } catch (error) {
      request.log.error(error);
      const tempDir = path.join(process.cwd(), 'temp-restore');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      return ApiResponse.error(reply, error.message || 'Gagal merestore backup', 500);
    }
  }
}

export const adminController = new AdminController();
