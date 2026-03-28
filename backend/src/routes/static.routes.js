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

const IS_DEV = process.env.NODE_ENV !== 'production';

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
    let absolutePath = path.resolve(UPLOAD_DIR, filePath);

    // Security check to prevent path traversal
    if (!absolutePath.startsWith(path.resolve(UPLOAD_DIR))) {
      return ApiResponse.error(reply, 'Forbidden', 403);
    }

    if (!fs.existsSync(absolutePath)) {
      // Fallback: try to locate by filename in known subfolders (videos, images, documents, avatars) and root
      const filenameOnly = path.basename(filePath);
      const candidates = [
        path.join(UPLOAD_DIR, filenameOnly), // root (race condition right after upload)
        ...['videos', 'images', 'documents', 'avatars']
          .map(sub => path.join(UPLOAD_DIR, sub, filenameOnly))
      ];
      
      const found = candidates.find(p => fs.existsSync(p));
      if (found) {
        absolutePath = found;
        if (IS_DEV) console.log(`[Static] Fallback resolved: ${filePath} -> ${found}`);
      } else {
        if (IS_DEV) console.log(`[Static] 404 - File not found: ${absolutePath}`);
        return ApiResponse.notFound(reply, 'File not found');
      }
    }

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

    // 2. Video Handling: Support Range Requests (HTTP 206) for seeking
    if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) {
      const fileSize = stat.size;
      const contentType = `video/${ext === '.mov' ? 'quicktime' : ext.substring(1)}`;
      const range = request.headers.range;

      if (range) {
        // Parse Range header: "bytes=start-end"
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        reply.status(206);
        reply.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        reply.header('Accept-Ranges', 'bytes');
        reply.header('Content-Length', chunkSize);
        reply.header('Content-Type', contentType);
        return reply.send(fs.createReadStream(absolutePath, { start, end }));
      }

      // No range requested — send full file
      reply.header('Content-Type', contentType);
      reply.header('Content-Length', fileSize);
      reply.header('Accept-Ranges', 'bytes');
      reply.header('Content-Disposition', 'inline');
      return reply.send(fs.createReadStream(absolutePath));
    }

    // 3. Image Handling: Ensure correct content-type even if extension missing
    if (
      ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext) ||
      (!ext && (filePath.startsWith('images/') || filePath.startsWith('avatars/')))
    ) {
      const mimeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.avif': 'image/avif'
      };
      const contentType = mimeMap[ext] || 'image/jpeg';
      reply.header('Content-Type', contentType);
      reply.header('Content-Disposition', 'inline');
      return reply.send(fs.createReadStream(absolutePath));
    }

    // 4. Fallback: Use Fastify's native file sender
    return reply.sendFile(filePath);
  });
}

