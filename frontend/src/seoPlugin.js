/**
 * plugins/seo.js
 *
 * Vite plugin agar sitemap.xml & robots.txt dilayani dari frontend
 * tanpa perlu mengubah reverse proxy / nginx.
 *
 * - Dev server (`configureServer`): request ke /sitemap.xml & /robots.txt
 *   diteruskan ke backend, dikembalikan dengan content-type yang benar
 *   (bukan SPA fallback index.html).
 * - Build (`writeBundle`): kedua file ditulis ke root output (dist) agar
 *   hosting statis (mis. nginx serve dist) juga ikut melayani.
 *
 * Alamat backend diambil dari opsi `backendUrl`, lalu env `SEO_BACKEND_URL`
 * (default `http://127.0.0.1:3000`). WAJIB menunjuk langsung ke proses
 * backend (bukan domain publik) agar tidak terjadi loop saat frontend &
 * backend di-proxy dari domain yang sama.
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'

const SEO_ROUTES = ['/sitemap.xml', '/robots.txt']

function resolveBackendBase(options) {
  const envUrl = process.env.SEO_BACKEND_URL
  const base = options?.backendUrl || envUrl || 'http://127.0.0.1:3000'
  return base.replace(/\/+$/, '')
}

async function fetchSeoFile(route, options) {
  const base = resolveBackendBase(options)
  const res = await fetch(base + route, {
    headers: { 'Accept-Encoding': 'identity' },
    signal: AbortSignal.timeout(5000)
  })
  if (!res.ok) throw new Error(`${base}${route} -> HTTP ${res.status}`)
  return res.text()
}

export default function seoPlugin(options = {}) {
  let outDir

  return {
    name: 'pf-space-seo',

    configResolved(config) {
      outDir = config.build.outDir
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const route = (req.url || '').split('?')[0]
        if (!SEO_ROUTES.includes(route)) return next()

        try {
          const body = await fetchSeoFile(route, options)
          res.statusCode = 200
          res.setHeader('Content-Type', route === '/sitemap.xml'
            ? 'application/xml; charset=utf-8'
            : 'text/plain; charset=utf-8')
          res.end(body)
        } catch (err) {
          console.warn(`[seo] gagal mengambil ${route} dari ${resolveBackendBase(options)}: ${err.message}`)
          res.statusCode = 502
          res.end('502 Bad Gateway')
        }
      })
    },

    async writeBundle() {
      for (const route of SEO_ROUTES) {
        const fileName = route.slice(1)
        try {
          const body = await fetchSeoFile(route, options)
          await writeFile(path.join(outDir, fileName), body, 'utf8')
          this.info(`[seo] ${fileName} ditulis ke ${outDir}`)
        } catch (err) {
          this.warn(`[seo] lewati penulisan ${fileName}: ${err.message}`)
        }
      }
    }
  }
}
