/**
 * src/routes/static.routes.js
 * 
 * Routes for serving static uploaded files with specialized handling 
 * for PDFs, videos, and images.
 */

import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR } from '../lib/upload.js';
import { ApiResponse } from '../lib/response.js';

/**
 * Register static file delivery routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function staticRoutes(fastify) {
  /**
   * Universal handler to serve uploaded files based on type and path
   */
  fastify.get('/uploads/*', async (request, reply) => {
    const filePath = request.params['*'];
    const absolutePath = path.join(UPLOAD_DIR, filePath);

    // Security check to prevent path traversal
    if (!absolutePath.startsWith(UPLOAD_DIR)) {
      return ApiResponse.error(reply, 'Forbidden', 403);
    }

    if (!fs.existsSync(absolutePath)) {
      console.log(`[Static] 404 - File not found: ${absolutePath}`);
      return ApiResponse.notFound(reply, 'File not found');
    }
    console.log(`[Static] Serving: ${absolutePath}`);

    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) {
      return ApiResponse.notFound(reply, 'File not found');
    }

    let ext = path.extname(absolutePath).toLowerCase();
    
    // If no extension, try to infer from the subfolder
    if (!ext) {
      if (filePath.startsWith('documents/')) ext = '.pdf';
      else if (filePath.startsWith('videos/')) ext = '.mp4';
      else if (filePath.startsWith('images/') || filePath.startsWith('avatars/')) ext = '.jpg';
    }

    // 1. PDF Handling: Set headers to ensure browser displays them inline
    if (ext === '.pdf') {
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', 'inline');
      return reply.send(fs.createReadStream(absolutePath));
    }

    // 2. Video Handling: Set proper content-type and disposition for streaming
    if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) {
      reply.header('Content-Type', `video/${ext === '.mov' ? 'quicktime' : ext.substring(1)}`);
      reply.header('Content-Disposition', 'inline');
      return reply.send(fs.createReadStream(absolutePath));
    }

    // 3. Fallback: Use Fastify's native file sender
    return reply.sendFile(filePath);
  });
}
