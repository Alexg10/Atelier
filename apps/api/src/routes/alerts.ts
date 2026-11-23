import type { FastifyInstance } from 'fastify'
import type { AlertSummary } from '@atelier/shared'
import { prisma } from '../db.ts'
import { toAlertSummary } from '../overview.ts'

const RECENT_LIMIT = 100

export async function alertRoutes(app: FastifyInstance) {
  // GET /alerts?open=true : les alertes en cours (pas encore revenues à la normale), les plus récentes d'abord.
  // Sans le filtre : les 100 dernières alertes, ouvertes ou non.
  app.get<{ Querystring: { open?: string } }>('/alerts', async (request): Promise<AlertSummary[]> => {
    const onlyOpen = request.query.open === 'true'
    const alerts = await prisma.alert.findMany({
      where: onlyOpen ? { clearedAt: null } : {},
      orderBy: { createdAt: 'desc' },
      take: onlyOpen ? undefined : RECENT_LIMIT,
    })
    return alerts.map(toAlertSummary)
  })
}
