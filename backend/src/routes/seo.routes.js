/**
 * src/routes/seo.routes.js
 * 
 * Routes for SEO related files like sitemap.xml and robots.txt
 */

import { generateSitemap } from '../lib/sitemap.js';

export default async function seoRoutes(fastify) {
  // sitemap.xml
  fastify.get('/sitemap.xml', async (request, reply) => {
    const xml = await generateSitemap();
    reply.type('application/xml').send(xml);
  });

  // robots.txt
  fastify.get('/robots.txt', async (request, reply) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /profile/
Disallow: /auth/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
    reply.type('text/plain').send(content);
  });
}
