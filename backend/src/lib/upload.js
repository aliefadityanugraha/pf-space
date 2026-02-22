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
import sharp from 'sharp';

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
 * Optimize an image file (resize and convert to webp)
 * @param {string} inputPath 
 * @param {string} outputPath (optional, if same as input it will overwrite)
 * @returns {Promise<string>} final output path
 */
export async function optimizeImage(inputPath, outputPath) {
  const targetPath = outputPath || inputPath + '.tmp';
  
  try {
    await sharp(inputPath)
      .resize(1200, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: 80 })
      .toFile(targetPath);

    // If we used a temp file, replace the original
    if (targetPath !== inputPath && !outputPath) {
      await fs.promises.unlink(inputPath);
      await fs.promises.rename(targetPath, inputPath);
    }
    
    return outputPath || inputPath;
  } catch (err) {
    console.error('[Sharp] Image optimization failed:', err.message);
    // Return original if optimization fails
    return inputPath;
  }
}

/**
 * Save a file stream to the appropriate upload subdirectory.
 * Optimizes images automatically.
 * @param {object} file - Fastify file object
 * @param {string} subfolder - Target subfolder (default: determined by mimetype)
 * @returns {string} Relative URL of the saved file
 */
export async function saveFile(file, subfolder) {
  const targetSubfolder = subfolder || getSubfolderForType(file.mimetype);
  const isImage = file.mimetype.startsWith('image/') && file.mimetype !== 'image/gif';
  
  // For images, we might want to change extension to .webp
  let uniqueName = generateUniqueName(file.filename);
  if (isImage) {
    const id = uniqueName.split('.')[0];
    uniqueName = `${id}.webp`;
  }
  
  const filePath = path.join(UPLOAD_DIR, targetSubfolder, uniqueName);
  
  if (isImage) {
    // Pipe through sharp for optimization
    const transformer = sharp()
      .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 80 });
      
    await pipeline(file.file, transformer, fs.createWriteStream(filePath));
  } else {
    // Direct stream for non-images
    await pipeline(file.file, fs.createWriteStream(filePath));
  }
  
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
/**
 * Calculate directory size and file count
 * @param {string} dirPath 
 * @returns {Promise<{size: number, count: number}>}
 */
async function getDirStats(dirPath) {
  let size = 0;
  let count = 0;

  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        const stats = await getDirStats(fullPath);
        size += stats.size;
        count += stats.count;
      } else {
        const stats = await fs.promises.stat(fullPath);
        size += stats.size;
        count++;
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err.message);
  }

  return { size, count };
}

/**
 * Get overall storage statistics for all upload subdirectories
 * @returns {Promise<object>} stats object
 */
export async function getStorageStats() {
  const stats = {
    totalSize: 0,
    totalCount: 0,
    categories: {}
  };

  for (const [key, sub] of Object.entries(UPLOAD_SUBDIRS)) {
    const subPath = path.join(UPLOAD_DIR, sub);
    const dirStats = await getDirStats(subPath);
    
    stats.categories[key] = {
      name: sub,
      size: dirStats.size,
      count: dirStats.count
    };
    
    stats.totalSize += dirStats.size;
    stats.totalCount += dirStats.count;
  }

  return stats;
}
