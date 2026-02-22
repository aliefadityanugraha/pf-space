/**
 * src/lib/tus.js
 * 
 * Tus.io server configuration for resumable file uploads.
 * Files are uploaded to a flat directory first, then moved
 * to organized subfolders (videos/, documents/, images/) on completion.
 * 
 * Features:
 * - Resumable uploads
 * - Metadata parsing (filename, filetype)
 * - Automatic subfolder organization
 * - Background image optimization for images
 */

import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { UPLOAD_DIR, getSubfolderForType, optimizeImage } from './upload.js';

/**
 * Parse Tus Upload-Metadata header into a key-value object.
 * Format: "key1 value1,key2 value2" where values are base64 encoded by tus-js-client.
 * 
 * @param {string} metadataHeader - Raw Upload-Metadata header from request
 * @returns {Record<string, string>} Parsed metadata object
 */
function parseMetadata(metadataHeader) {
  const metadata = {};
  if (!metadataHeader) return metadata;
  
  try {
    metadataHeader.split(',').forEach(part => {
      const parts = part.trim().split(' ');
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts[1];
        metadata[key] = Buffer.from(value, 'base64').toString();
      }
    });
  } catch (err) {
    console.error('[Tus] Metadata parsing failed:', err);
  }
  return metadata;
}

/**
 * Main Tus Server instance for handling resumable uploads.
 * Configured with FileStore and specialized naming/hooks.
 */
export const tusServer = new Server({
  path: '/api/files',
  datastore: new FileStore({
    directory: UPLOAD_DIR,
  }),
  // Disable tus server's built-in CORS — handled by Fastify hooks in tus.routes.js
  respectForwardedHeaders: true,
  
  /**
   * Generates a unique filename for the upload.
   * Attempts to preserve extension from metadata or filetype.
   * 
   * @param {import('http').IncomingMessage} req - Node.js request object
   * @returns {string} Unique UUID-based filename
   */
  namingFunction: (req) => {
    const headers = req.headers || {};
    const metadataHeader = headers['upload-metadata'] || headers['Upload-Metadata'] || '';
    const metadata = parseMetadata(metadataHeader);
    
    const filename = metadata.filename || '';
    const filetype = metadata.filetype || '';
    
    // Determine file extension
    let ext = '';
    
    // 1. Try from filename
    if (filename) {
      const detectedExt = path.extname(filename);
      if (detectedExt) {
        ext = detectedExt;
      }
    } 
    
    // 2. Try from filetype if extension still empty
    if (!ext && filetype) {
      if (filetype === 'application/pdf') ext = '.pdf';
      else if (filetype.startsWith('video/')) {
        const videoExt = filetype.split('/')[1];
        ext = `.${videoExt === 'quicktime' ? 'mov' : videoExt}`;
      } else if (filetype.startsWith('image/')) {
        ext = `.${filetype.split('/')[1]}`;
      }
    }
    
    // 3. Special case for learning materials which are mostly PDFs (route-based fallback)
    if (!ext && (req.url || '').includes('learning-materials')) {
      ext = '.pdf';
    }
    
    const id = crypto.randomUUID();
    const finalName = `${id}${ext || ''}`;
    
    return finalName;
  },

  /**
   * Hook called after an upload is fully completed.
   * Responsible for:
   * 1. Identifying the correct destination subfolder
   * 2. Moving the file from root to subfolder
   * 3. Moving associated metadata JSON file
   * 4. Triggering image optimization if applicable
   * 
   * @param {import('http').IncomingMessage} req - Node.js request object
   * @param {import('http').ServerResponse} res - Node.js response object
   * @param {object} upload - Metadata about the finished upload
   */
  onUploadFinish: async (req, res, upload) => {
    try {
      const headers = req.headers || {};
      const metadataHeader = headers['upload-metadata'] || headers['Upload-Metadata'] || '';
      const parsedMeta = parseMetadata(metadataHeader);
      const filetype = parsedMeta.filetype || '';
      const urlId = (req.url || '').split('/').filter(Boolean).pop() || '';
      const effectiveId = (upload && upload.id) || urlId;
      
      let subfolder = getSubfolderForType(filetype);
      const isUnknownType = !filetype || filetype === 'application/octet-stream' || filetype === 'binary/octet-stream';
      let ext = (path.extname(effectiveId) || '').toLowerCase();
      
      // Attempt to get extension from Upload-Metadata filename if ID doesn't have it
      if (!ext && parsedMeta.filename) {
        ext = (path.extname(parsedMeta.filename) || '').toLowerCase();
      }

      // If type is unknown, try to detect from metadata JSON stored by @tus/file-store
      if (isUnknownType) {
        try {
          const metaPathProbe = path.join(UPLOAD_DIR, `${effectiveId}.json`);
          if (fs.existsSync(metaPathProbe)) {
            const raw = fs.readFileSync(metaPathProbe, 'utf8');
            try {
              const json = JSON.parse(raw);
              const jsonMeta = json && (json.metadata || json.upload_metadata || json.meta || {});
              const jsonFiletype = (jsonMeta && (jsonMeta.filetype || jsonMeta['filetype'])) || '';
              const jsonFilename = (jsonMeta && (jsonMeta.filename || jsonMeta['filename'])) || '';
              if (!ext && jsonFilename) {
                ext = (path.extname(jsonFilename) || '').toLowerCase();
              }
              if (jsonFiletype && (jsonFiletype !== 'application/octet-stream' && jsonFiletype !== 'binary/octet-stream')) {
                subfolder = getSubfolderForType(jsonFiletype);
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        } catch {}
      }

      // Fallback mapping by extension for better organization
      if (isUnknownType) {
        if (['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.avi', '.mkv'].includes(ext)) subfolder = 'videos';
        else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].includes(ext)) subfolder = 'images';
        else if (ext === '.pdf') subfolder = 'documents';
      }
      
      const currentPath = path.join(UPLOAD_DIR, effectiveId);
      const targetDir = path.join(UPLOAD_DIR, subfolder);
      const targetPath = path.join(targetDir, effectiveId);

      // Ensure target subfolder exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Move file to subfolder if it exists in root
      if (fs.existsSync(currentPath)) {
        try {
          fs.renameSync(currentPath, targetPath);
          console.log(`[Tus] ✅ Upload finished: ${effectiveId} -> ${subfolder}/`);
          
          // Trigger image optimization for posters/banners
          if (subfolder === 'images' && !effectiveId.toLowerCase().endsWith('.gif')) {
            optimizeImage(targetPath).catch(err => {
              console.error('[Tus] Optimization background error:', err.message);
            });
          }
        } catch (renameErr) {
          // Fallback to copy+unlink if across partitions
          fs.copyFileSync(currentPath, targetPath);
          fs.unlinkSync(currentPath);
          
          if (subfolder === 'images' && !effectiveId.toLowerCase().endsWith('.gif')) {
            optimizeImage(targetPath).catch(err => {
              console.error('[Tus] Optimization background error:', err.message);
            });
          }
        }
        
        // Move the .json metadata file to maintain consistency
        const metaPath = `${currentPath}.json`;
        if (fs.existsSync(metaPath)) {
          const targetMetaPath = `${targetPath}.json`;
          try {
            fs.renameSync(metaPath, targetMetaPath);
          } catch (e) {
            fs.copyFileSync(metaPath, targetMetaPath);
            fs.unlinkSync(metaPath);
          }
        }
      } else if (!fs.existsSync(targetPath)) {
        console.error(`[Tus] ❌ Uploaded file not found: ${effectiveId}`);
      }
    } catch (err) {
      console.error('[Tus] Critical error in onUploadFinish:', err);
    }

    return res;
  },
});
