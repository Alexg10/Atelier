import type { FastifyInstance } from 'fastify'
import type { AlertSummary } from '@atelier/shared'
import { prisma } from '../db.ts'
import { toAlertSummary } from '../overview.ts'

const RECENT_LIMIT = 100

export async function alertRoutes(app: FastifyInstance) {
  // GET /alerts?open=true : les alertes en cours (pas encore revenues à la normale), les plus récentes d'abord.
  // GET /alerts?machineId=3 : l'historique d'une machine. Sans filtre « open » : les 100 dernières, ouvertes ou non.
  app.get<{ Querystring: { open?: string; machineId?: string } }>('/alerts', async (request, reply) => {
    const onlyOpen = request.query.open === 'true'
    const machineId = request.query.machineId === undefined ? undefined : Number(request.query.machineId)
    if (machineId !== undefined && !Number.isInteger(machineId)) {
      return reply.code(400).send({ error: 'Invalid machine id' })
    }

    const alerts = await prisma.alert.findMany({
      where: { machineId, ...(onlyOpen ? { clearedAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: onlyOpen ? undefined : RECENT_LIMIT,
    })
    return alerts.map(toAlertSummary) satisfies AlertSummary[]
  })
}
