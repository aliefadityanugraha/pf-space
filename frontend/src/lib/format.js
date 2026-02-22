/**
 * Base API URL — single source of truth for asset URL resolution.
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Resolve a relative asset path to an absolute URL using the API base.
 * Returns the original value unchanged if it's already an absolute URL or falsy.
 */
export function assetUrl(url) {
  if (!url) return url
  
  // Return early if it's already an absolute URL (http, https, or protocol-relative //)
  if (/^(https?:)?\/\//i.test(url)) return url
  
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  let path = url.startsWith('/') ? url : `/${url}`
  
  // Auto-prepend /uploads if it's a relative path and doesn't have it
  if (!path.startsWith('/uploads/') && !path.startsWith('/api/')) {
    path = `/uploads${path}`
  }
  
  return `${base}${path}`
}

export function formatDate(date, withTime = false) {
  if (!date) return '-'
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }
  if (withTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
    options.month = 'short' // Shorter month for comments
  }
  return new Date(date).toLocaleDateString('id-ID', options)
}

/**
 * Relative time display (e.g. "5 menit yang lalu").
 * Centralises the date-fns import + Indonesian locale so individual
 * components don't have to.
 */
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export function timeAgo(date) {
  if (!date) return '-'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: idLocale })
}
