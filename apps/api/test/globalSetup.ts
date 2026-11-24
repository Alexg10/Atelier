import { execSync } from 'node:child_process'
import type { TestProject } from 'vitest/node'

// Crée la base de test si besoin et la met au niveau du schéma (les mêmes migrations qu'en prod).
export default function setup(project: TestProject) {
  execSync('pnpm exec prisma migrate deploy', {
    cwd: project.config.root,
    env: { ...process.env, DATABASE_URL: project.config.env.DATABASE_URL },
    stdio: 'inherit',
  })
}
