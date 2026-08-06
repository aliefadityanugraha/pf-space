/**
 * frontend/src/lib/uploadFileTus.js
 *
 * Reusable Tus.io upload helper (tus-js-client). Uploads a file to the
 * existing backend Tus endpoint (`/api/files/`) and resolves the final
 * served path (`/uploads/<subfolder>/<id>`) once the upload finishes.
 *
 * Shared by ArchiveUploadForm and the Production Feed editor so the upload
 * logic is defined once and behaves identically everywhere.
 */

import * as tus from 'tus-js-client'
import { BASE_URL } from '@/lib/api'

/**
 * Determine the upload subfolder for a file when its MIME type is unknown.
 * `hint` is an optional field/context name used by callers to steer the
 * fallback (e.g. a poster field should always land in images/).
 * @param {File} file
 * @param {string} [hint]
 * @returns {string} 'images' | 'videos' | 'documents'
 */
export function guessUploadSubfolder(file, hint) {
  if (file?.type?.startsWith('video/')) return 'videos'
  if (file?.type === 'application/pdf') return 'documents'
  if (file?.type?.startsWith('image/')) return 'images'

  if (hint === 'gambar_poster' || hint === 'banner_url' || hint === 'cover') return 'images'
  if (
    hint === 'file_naskah' ||
    hint === 'file_storyboard' ||
    hint === 'file_rab' ||
    hint === 'pdf'
  ) {
    return 'documents'
  }
  if (hint === 'video') return 'videos'

  return 'documents'
}

/**
 * Normalize a tus upload URL returned by the backend (Location header) so the
 * upload is always resumed through the same origin that served the page.
 *
 * The backend may reply with an absolute URL on its own host (e.g.
 * `http://localhost:3000/api/files/<id>`). Pointing the browser at that host is
 * fragile: cross-origin, and blindly upgrading `http:` to `https:` breaks when
 * the backend is plain HTTP (ERR_SSL_PROTOCOL_ERROR). Rebuilding the URL against
 * `origin` routes through the same proxy / TLS terminator that already serves
 * the app. Returns the input unchanged when no `/api/files/<id>` is present.
 * @param {string} url
 * @param {string} origin
 * @returns {string}
 */
export function normalizeTusUploadUrl(url, origin) {
  if (!url || !origin) return url
  const id = (url.split('/api/files/')[1] || '').replace(/\/+$/, '')
  if (!id) return url
  const sameOrigin = `${origin.replace(/\/$/, '')}/api/files/${id}`
  return url === sameOrigin ? url : sameOrigin
}

/**
 * Upload a file via Tus and resolve to its served path.
 * @param {File} file - File to upload
 * @param {(percent: number) => void} [onProgress] - Progress callback (0-100)
 * @param {string} [hint] - Optional field/context name for subfolder fallback
 * @returns {Promise<string>} Resolved `/uploads/<subfolder>/<id>` path
 */
export function uploadFileTus(file, onProgress, hint) {
  return new Promise((resolve, reject) => {
    const endpoint =
      typeof window !== 'undefined'
        ? `${window.location.origin}/api/files/`
        : `${BASE_URL.replace(/\/$/, '')}/api/files/`

    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage).filter(
          (key) => key.includes('tus') || key.includes('upload')
        )
        keys.forEach((key) => localStorage.removeItem(key))
      } catch (err) {
        console.warn('[Tus] Unable to clear previous upload storage', err)
      }
    }

    let upload
    upload = new tus.Upload(file, {
      endpoint,
      chunkSize: 32 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type || 'application/octet-stream'
      },
      onBeforeRequest: (req) => {
        if (typeof window !== 'undefined' && upload && upload.url) {
          const sameOriginUrl = normalizeTusUploadUrl(upload.url, window.location.origin)
          if (sameOriginUrl && upload.url !== sameOriginUrl) {
            upload.url = sameOriginUrl
          }
        }
      },
      onAfterResponse: (req, res) => {
        if (typeof window !== 'undefined') {
          const location =
            (typeof res?.getHeader === 'function' &&
              (res.getHeader('location') || res.getHeader('Location'))) ||
            upload?.url
          if (location) {
            const sameOriginUrl = normalizeTusUploadUrl(location, window.location.origin)
            if (sameOriginUrl && upload && upload.url !== sameOriginUrl) {
              upload.url = sameOriginUrl
            }
          }
        }
      },
      storeFingerprintForResuming: false,
      uploadUrl: null,
      onError: (error) => {
        reject(error)
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(0)
        if (onProgress) onProgress(+percentage)
      },
      onSuccess: () => {
        try {
          const id = upload.url.split('/api/files/')[1]
          if (id && id.includes('/')) {
            resolve(`/uploads/${id}`)
          } else {
            const subfolder = guessUploadSubfolder(file, hint)
            resolve(id ? `/uploads/${subfolder}/${id}` : upload.url)
          }
        } catch (e) {
          resolve(upload.url)
        }
      }
    })

    upload.start()
  })
}

export default uploadFileTus
