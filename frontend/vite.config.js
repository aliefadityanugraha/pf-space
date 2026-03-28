import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    allowedHosts: ['103.127.96.155']
  },
  test: {
    environment: 'happy-dom',
    globals: true
  },
  build: {
    chunkSizeWarningLimit: 1000,
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
  }
})
