/**
 * src/lib/sitemap.js
 * 
 * Utility to generate an XML sitemap for SEO.
 * Includes static pages and dynamic film/archive routes.
 */

import { Film } from '../models/Film.js';

/**
 * Generates the XML sitemap string
 * @returns {Promise<string>} XML string
 */
export async function generateSitemap() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const lastMod = new Date().toISOString().split('T')[0];

  // 1. Define Static Routes
  const staticRoutes = [
    '',
    '/films',
    '/materi',
    '/feed',
    '/community',
    '/festival',
    '/trending',
    '/about',
    '/changelog',
    '/contact',
    '/privacy',
    '/terms',
    '/guidelines'
  ];

  // 2. Fetch Dynamic Routes (Published Films)
  const films = await Film.query()
    .where('status', 'published')
    .select('slug', 'updated_at')
    .whereNotNull('slug')
    .where('slug', '!=', '');

  const xmlEscape = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add Static URLs
  staticRoutes.forEach(route => {
    xml += `
  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
  });

  // Add Film URLs
  films.forEach(film => {
    const filmDate = film.updated_at ? new Date(film.updated_at).toISOString().split('T')[0] : lastMod;
    xml += `
  <url>
    <loc>${baseUrl}/archive/${xmlEscape(film.slug)}</loc>
    <lastmod>${filmDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  return xml;
}
