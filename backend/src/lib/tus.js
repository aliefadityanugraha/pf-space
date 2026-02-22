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
import { UPLOAD_DIR, getSubfolderForType, optimizeImage } from './upload.js';

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
    try {
      const headerKeys = Object.keys(headers || {});
      console.log('[Tus] namingFunction: method=%s url=%s headerKeys=%o', req.method, req.url, headerKeys);
      console.log('[Tus] namingFunction: metadataHeader=%s', metadataHeader);
      console.log('[Tus] namingFunction: parsed metadata=%o', metadata);
    } catch {}
    
    const filename = metadata.filename || '';
    const filetype = metadata.filetype || '';
    
    console.log(`[Tus] Naming function - Filename: ${filename}, Type: ${filetype}`);

    // Determine file extension
    let ext = '';
    let extSource = 'none';
    
    // 1. Try from filename
    if (filename) {
      const detectedExt = path.extname(filename);
      if (detectedExt) {
        ext = detectedExt;
        extSource = 'filename';
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
      if (ext) extSource = 'filetype';
    }
    
    // 3. Special case for learning materials which are mostly PDFs
    if (!ext && (req.url || '').includes('learning-materials')) {
      ext = '.pdf';
      extSource = 'route';
    }
    
    console.log('[Tus] namingFunction: chosen ext=%s source=%s', ext || '(empty)', extSource);

    const id = crypto.randomUUID();
    const finalName = `${id}${ext || ''}`;
    
    console.log(`[Tus] Upload created - ID: ${finalName}`);
    return finalName;
  },

  // After upload completes, move file from root uploads/ to the correct subfolder
  onUploadFinish: async (req, res, upload) => {
    try {
      const headers = req.headers || {};
      const metadataHeader = headers['upload-metadata'] || headers['Upload-Metadata'] || '';
      const parsedMeta = parseMetadata(metadataHeader);
      const filetype = parsedMeta.filetype || '';
      const urlId = (req.url || '').split('/').filter(Boolean).pop() || '';
      const effectiveId = (upload && upload.id) || urlId;
      console.log('[Tus] onUploadFinish: rawId=%s urlId=%s', upload && upload.id, urlId);
      let subfolder = getSubfolderForType(filetype);
      const isUnknownType = !filetype || filetype === 'application/octet-stream' || filetype === 'binary/octet-stream';
      let ext = (path.extname(effectiveId) || '').toLowerCase();
      // Tambahan: coba ambil ekstensi dari Upload-Metadata (filename) jika ID tanpa ekstensi
      if (!ext && parsedMeta.filename) {
        ext = (path.extname(parsedMeta.filename) || '').toLowerCase();
      }
      // Jika tipe tidak dikenal, coba deteksi dari metadata JSON yang disimpan oleh @tus/file-store
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
              console.log('[Tus] onUploadFinish: jsonMeta filetype=%s filename=%s', jsonFiletype || '(none)', jsonFilename || '(none)');
            } catch (e) {
              console.warn('[Tus] onUploadFinish: gagal parse metadata JSON:', e.message);
            }
          }
        } catch {}
      }
      // Terakhir, mapping berdasarkan ekstensi jika masih belum jelas
      if (isUnknownType) {
        if (['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.avi', '.mkv'].includes(ext)) subfolder = 'videos';
        else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].includes(ext)) subfolder = 'images';
        else if (ext === '.pdf') subfolder = 'documents';
      }
      
      const currentPath = path.join(UPLOAD_DIR, effectiveId);
      const targetDir = path.join(UPLOAD_DIR, subfolder);
      const targetPath = path.join(targetDir, effectiveId);

      console.log(`[Tus] onUploadFinish - id: ${effectiveId}, type: ${filetype || '(empty)'}, ext: ${ext || '(none)'}, subfolder: ${subfolder}`);
      console.log('[Tus] onUploadFinish: currentPath=%s targetDir=%s targetPath=%s', currentPath, targetDir, targetPath);

      // Ensure target subfolder exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log('[Tus] onUploadFinish: created targetDir');
      }

      // Move file to subfolder if it exists in root
      if (fs.existsSync(currentPath)) {
        try {
          const stat = fs.statSync(currentPath);
          console.log('[Tus] onUploadFinish: currentPath exists size=%d bytes', stat.size);
        } catch {}
        // Use copy + unlink if rename fails (e.g., across volumes, though unlikely here)
        try {
          fs.renameSync(currentPath, targetPath);
          console.log(`[Tus] ✅ Moved file: ${effectiveId} -> ${subfolder}/`);
          
          // Optimize if it's an image
          if (subfolder === 'images' && !effectiveId.toLowerCase().endsWith('.gif')) {
            console.log(`[Tus] ⚡ Optimizing image: ${effectiveId}`);
            optimizeImage(targetPath).catch(err => {
              console.error('[Tus] Optimization background error:', err.message);
            });
          }
        } catch (renameErr) {
          console.warn(`[Tus] Rename failed, trying copy: ${renameErr.message}`);
          fs.copyFileSync(currentPath, targetPath);
          fs.unlinkSync(currentPath);
          console.log('[Tus] onUploadFinish: copy+unlink completed');

          // Optimize if it's an image
          if (subfolder === 'images' && !effectiveId.toLowerCase().endsWith('.gif')) {
            console.log(`[Tus] ⚡ Optimizing image: ${effectiveId}`);
            optimizeImage(targetPath).catch(err => {
              console.error('[Tus] Optimization background error:', err.message);
            });
          }
        }
        
        // Also move the .json metadata file
        const metaPath = `${currentPath}.json`;
        if (fs.existsSync(metaPath)) {
          // no-op
        }
        if (fs.existsSync(metaPath)) {
          const targetMetaPath = `${targetPath}.json`;
          try {
            fs.renameSync(metaPath, targetMetaPath);
            console.log('[Tus] onUploadFinish: metadata rename ok');
          } catch (e) {
            if (fs.existsSync(metaPath)) {
              fs.copyFileSync(metaPath, targetMetaPath);
              fs.unlinkSync(metaPath);
              console.log('[Tus] onUploadFinish: metadata copy+unlink ok');
            }
          }
          console.log(`[Tus] ✅ Moved metadata: ${effectiveId}.json -> ${subfolder}/`);
        }
      } else {
        // Maybe it's already in the target folder? (e.g. if hook called twice or resumed)
        if (fs.existsSync(targetPath)) {
          console.log(`[Tus] ℹ️ File already in target folder: ${targetPath}`);
        } else {
          console.error(`[Tus] ❌ File not found anywhere: ${effectiveId}`);
        }
      }
    } catch (err) {
      console.error('[Tus] Error in onUploadFinish:', err);
    }

    return res;
  },
});
