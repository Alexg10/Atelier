import type { FastifyInstance } from 'fastify'
import type { UserSummary } from '@atelier/shared'
import { prisma } from '../db.ts'

export async function userRoutes(app: FastifyInstance) {
  // Pour choisir un Assignee dans le formulaire.
  app.get('/users', async (): Promise<UserSummary[]> => {
    return prisma.user.findMany({ orderBy: { name: 'asc' } })
  })
}
