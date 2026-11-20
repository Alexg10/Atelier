import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Le plugin apprend à Vite à compiler les fichiers .vue (SFC) en JavaScript.
  plugins: [vue(), tailwindcss()],
})
