import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import seoPlugin from './src/seoPlugin.js'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001';

export default defineConfig({
  plugins: [vue(), tailwindcss(), seoPlugin({ backendUrl: 'http://127.0.0.1:3001' })],
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
        secure: false
      },
      '/uploads': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false
      }
    }
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
