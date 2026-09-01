import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import seoPlugin from './src/seoPlugin.js'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001';
const seoBackendUrl = process.env.SEO_BACKEND_URL || 'http://127.0.0.1:3001';

export default defineConfig({
  plugins: [vue(), tailwindcss(), seoPlugin({ backendUrl: seoBackendUrl })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['192.168.3.229', 'localhost', '127.0.0.1', 'pfspace.my.id', 'www.pfspace.my.id'],
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Tell the backend what host/protocol the browser actually used,
            // so generateUrl in tus.js builds the correct Location header.
            const proto = req.socket?.encrypted ? 'https' : 'http';
            const host = req.headers['host'] || 'localhost:5173';
            proxyReq.setHeader('X-Forwarded-Proto', proto);
            proxyReq.setHeader('X-Forwarded-Host', host);
          });
        }
      },
      '/uploads': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 5173,
    strictPort: true
  },
  test: {
    environment: 'happy-dom',
    globals: true
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', '@vueuse/core'],
          'vendor-editor': ['@tiptap/vue-3', '@tiptap/starter-kit'],
          'vendor-player': ['plyr', 'hls.js'],
          'vendor-icons': ['lucide-vue-next']
        }
      }
    }
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})
