import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['10.20.39.108', 'localhost', '127.0.0.1'],
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
    rollupOptions: {
      output: {
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
