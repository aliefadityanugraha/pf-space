/**
 * src/lib/tus.js
 * 
 * Tus.io server configuration for resumable file uploads.
 * Files are uploaded to a flat directory first, then moved
 * to organized subfolders (videos/, documents/, images/) on completion.
 */

import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { UPLOAD_DIR, getSubfolderForType } from './upload.js';

/**
 * Parse Tus Upload-Metadata header into a key-value object.
 * Format: "key1 value1,key2 value2" where values are base64 encoded.
 * @param {string} metadataHeader - Raw Upload-Metadata header
 * @returns {object} Parsed metadata
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

export const tusServer = new Server({
  path: '/api/files',
  datastore: new FileStore({
    directory: UPLOAD_DIR,
  }),
  // Disable tus server's built-in CORS — handled by Fastify hooks in tus.routes.js
  respectForwardedHeaders: true,
  
  // Use FLAT naming (no subdirectory) so FileStore can find files for PATCH
  namingFunction: (req) => {
    const headers = req.headers || {};
    // Fastify usually lowercases headers in request.raw.headers
    const metadataHeader = headers['upload-metadata'] || headers['Upload-Metadata'] || '';
    const metadata = parseMetadata(metadataHeader);
    
    const filename = metadata.filename || '';
    const filetype = metadata.filetype || '';
    
    console.log(`[Tus] Naming function - Filename: ${filename}, Type: ${filetype}`);

    // Determine file extension
    let ext = '';
    
    // 1. Try from filename
    if (filename) {
      const detectedExt = path.extname(filename);
      if (detectedExt) ext = detectedExt;
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
    
    // 3. Special case for learning materials which are mostly PDFs
    if (!ext && (req.url || '').includes('learning-materials')) {
      ext = '.pdf';
    }

    const id = crypto.randomUUID();
    const finalName = `${id}${ext || ''}`;
    
    console.log(`[Tus] Upload created - ID: ${finalName}`);
    return finalName;
  },

  // After upload completes, move file from root uploads/ to the correct subfolder
  onUploadFinish: async (req, res, upload) => {
    try {
      const filetype = upload.metadata?.filetype || '';
      const subfolder = getSubfolderForType(filetype);
      
      const currentPath = path.join(UPLOAD_DIR, upload.id);
      const targetDir = path.join(UPLOAD_DIR, subfolder);
      const targetPath = path.join(targetDir, upload.id);

      console.log(`[Tus] onUploadFinish - id: ${upload.id}, type: ${filetype}, subfolder: ${subfolder}`);

      // Ensure target subfolder exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Move file to subfolder if it exists in root
      if (fs.existsSync(currentPath)) {
        // Use copy + unlink if rename fails (e.g., across volumes, though unlikely here)
        try {
          fs.renameSync(currentPath, targetPath);
          console.log(`[Tus] ✅ Moved file: ${upload.id} -> ${subfolder}/`);
        } catch (renameErr) {
          console.warn(`[Tus] Rename failed, trying copy: ${renameErr.message}`);
          fs.copyFileSync(currentPath, targetPath);
          fs.unlinkSync(currentPath);
        }
        
        // Also move the .json metadata file
        const metaPath = `${currentPath}.json`;
        if (fs.existsSync(metaPath)) {
          const targetMetaPath = `${targetPath}.json`;
          try {
            fs.renameSync(metaPath, targetMetaPath);
          } catch (e) {
            if (fs.existsSync(metaPath)) {
              fs.copyFileSync(metaPath, targetMetaPath);
              fs.unlinkSync(metaPath);
            }
          }
          console.log(`[Tus] ✅ Moved metadata: ${upload.id}.json -> ${subfolder}/`);
        }
      } else {
        // Maybe it's already in the target folder? (e.g. if hook called twice or resumed)
        if (fs.existsSync(targetPath)) {
          console.log(`[Tus] ℹ️ File already in target folder: ${targetPath}`);
        } else {
          console.error(`[Tus] ❌ File not found anywhere: ${upload.id}`);
        }
      }
    } catch (err) {
      console.error('[Tus] Error in onUploadFinish:', err);
    }

    return res;
  },
});
