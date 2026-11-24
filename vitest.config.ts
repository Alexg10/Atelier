import { defineConfig } from 'vitest/config'

// Un seul `pnpm test` à la racine pour tout le monorepo : chaque package est un « projet » Vitest.
// apps/web réutilise automatiquement son vite.config.ts (plugin Vue compris).
export default defineConfig({
  test: {
    projects: ['packages/shared', 'apps/api', 'apps/web'],
  },
})
