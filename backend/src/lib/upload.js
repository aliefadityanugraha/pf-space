/**
 * src/lib/upload.js
 * 
 * Utility functions for handling file uploads, generating
 * unique filenames, and managing the file system.
 * 
 * Upload structure:
 *   uploads/
 *     ├── videos/      (video utama, trailer, BTS)
 *     ├── documents/   (naskah, storyboard, RAB)
 *     ├── images/      (poster, banner)
 *     └── avatars/     (foto profil user)
 */

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Subfolder constants
export const UPLOAD_SUBDIRS = {
  videos: 'videos',
  documents: 'documents',
  images: 'images',
  avatars: 'avatars',
};

// Valid subfolder names for route validation
export const VALID_SUBFOLDERS = Object.values(UPLOAD_SUBDIRS);

// Ensure all directories exist on startup
[UPLOAD_DIR, ...VALID_SUBFOLDERS.map(s => path.join(UPLOAD_DIR, s))].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Determine subfolder based on MIME type
 * @param {string} mimeType 
 * @returns {string} subfolder name
 */
export function getSubfolderForType(mimeType) {
  if (!mimeType) return UPLOAD_SUBDIRS.documents;
  if (mimeType.startsWith('video/')) return UPLOAD_SUBDIRS.videos;
  if (mimeType.startsWith('image/')) return UPLOAD_SUBDIRS.images;
  if (mimeType === 'application/pdf') return UPLOAD_SUBDIRS.documents;
  return UPLOAD_SUBDIRS.documents;
}

/**
 * Generate a unique filename with UUID
 * @param {string} originalName 
 * @returns {string}
 */
export function generateUniqueName(originalName) {
  const extension = path.extname(originalName);
  return `${crypto.randomUUID()}${extension}`;
}

/**
 * Save a file stream to the appropriate upload subdirectory
 * @param {object} file - Fastify file object
 * @param {string} subfolder - Target subfolder (default: determined by mimetype)
 * @returns {string} Relative URL of the saved file
 */
export async function saveFile(file, subfolder) {
  const targetSubfolder = subfolder || getSubfolderForType(file.mimetype);
  const uniqueName = generateUniqueName(file.filename);
  const filePath = path.join(UPLOAD_DIR, targetSubfolder, uniqueName);
  
  await pipeline(file.file, fs.createWriteStream(filePath));
  
  return `/uploads/${targetSubfolder}/${uniqueName}`;
}

/**
 * Delete a file by its URL or path.
 * Also removes tus metadata (.json) file if present.
 * @param {string} fileUrl - e.g. "/uploads/videos/uuid.mp4"
 */
export async function deleteFile(fileUrl) {
  if (!fileUrl) return;

  try {
    // Extract relative path after /uploads/
    const uploadsMarker = '/uploads/';
    const idx = fileUrl.indexOf(uploadsMarker);
    if (idx === -1) return;

    const relativePath = fileUrl.substring(idx + uploadsMarker.length);
    if (!relativePath) return;

    const filePath = path.join(UPLOAD_DIR, relativePath);
    
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`Deleted file: ${filePath}`);
    }

    // Also delete tus metadata file if it exists
    const metadataPath = `${filePath}.json`;
    if (fs.existsSync(metadataPath)) {
      await fs.promises.unlink(metadataPath);
      console.log(`Deleted metadata: ${metadataPath}`);
    }
  } catch (err) {
    console.error(`Failed to delete file ${fileUrl}:`, err);
  }
}
