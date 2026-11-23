import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Le plugin apprend à Vite à compiler les fichiers .vue (SFC) en JavaScript.
  plugins: [vue(), tailwindcss()],
  server: {
    // En dev, /api/* est relayé vers l'API Fastify : même origine pour le navigateur, donc pas de CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
