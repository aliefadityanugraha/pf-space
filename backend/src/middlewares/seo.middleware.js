/**
 * src/middlewares/seo.middleware.js
 * 
 * Middleware for server-side rendering meta tags to improve 
 * social sharing previews for crawlers and bots.
 */

import { filmService } from '../services/index.js';

/**
 * Middleware to handle SEO for bots/crawlers.
 * Intercepts requests from known bots and provides a static HTML page 
 * with Open Graph and Twitter meta tags for better link previews.
 * 
 * @param {import('fastify').FastifyRequest} request - Fastify request
 * @param {import('fastify').FastifyReply} reply - Fastify reply
 */
export const seoMiddleware = async (request, reply) => {
  const userAgent = request.headers['user-agent'] || '';
  
  // List of bots/crawlers that should receive SSR meta tags
  const isBot = /bot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|googlebot/i.test(userAgent);

  // If it's a bot and requesting a detail page
  if (isBot && request.url.includes('/detail/')) {
    try {
      // Extract segment after /detail/ (could be ID or slug)
      const identifier = request.url.split('/detail/').pop()?.split('?')[0];
      
      if (!identifier) return;

      // Try fetching by slug first, then ID
      let film = await filmService.getBySlug(identifier);
      if (!film && !isNaN(identifier)) {
        film = await filmService.getById(identifier);
      }

      if (film) {
        const title = `${film.judul} | PF Space`;
        const description = film.sinopsis ? 
          (film.sinopsis.length > 160 ? film.sinopsis.substring(0, 157) + '...' : film.sinopsis) : 
          'Lihat karya film siswa di PF Space.';
        
        const apiUrl = process.env.API_URL || 'http://localhost:3000';
        const posterUrl = film.gambar_poster ? 
          (film.gambar_poster.startsWith('http') ? film.gambar_poster : `${apiUrl}${film.gambar_poster}`) : 
          `${apiUrl}/default-poster.jpg`;

        const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const pageUrl = `${siteUrl}/detail/${film.slug || film.film_id}`;

        // Return minimal HTML with necessary meta tags for crawlers
        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html lang="id">
            <head>
              <meta charset="utf-8">
              <title>${title}</title>
              <meta name="description" content="${description}">
              
              <!-- Open Graph / Facebook -->
              <meta property="og:type" content="video.other">
              <meta property="og:url" content="${pageUrl}">
              <meta property="og:title" content="${title}">
              <meta property="og:description" content="${description}">
              <meta property="og:image" content="${posterUrl}">

              <!-- Twitter -->
              <meta property="twitter:card" content="summary_large_image">
              <meta property="twitter:url" content="${pageUrl}">
              <meta property="twitter:title" content="${title}">
              <meta property="twitter:description" content="${description}">
              <meta property="twitter:image" content="${posterUrl}">

              <!-- Additional Tags -->
              <meta name="author" content="${film.creator?.name || 'siswa SI'}">
            </head>
            <body>
              <h1>${film.judul}</h1>
              <p>${description}</p>
              <img src="${posterUrl}" alt="${film.judul}" />
            </body>
          </html>
        `);
      }
    } catch (err) {
      console.error('SEO Middleware Error:', err);
      // Fallback: let the request proceed to the regular frontend
    }
  }
};
