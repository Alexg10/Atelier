import type { FastifyInstance } from 'fastify'
import { computeHealth, type MachineOverview, type Thresholds } from '@atelier/shared'
import { prisma } from '../db.ts'

// Ce qu'on demande à Prisma pour construire un MachineOverview (partagé par les deux routes).
const overviewInclude = {
  // Dernier relevé seulement (l'index machineId + timestamp rend ça rapide).
  readings: { orderBy: { timestamp: 'desc' }, take: 1 },
  // Nombre d'alertes en cours (pas encore revenues à la normale).
  _count: { select: { alerts: { where: { clearedAt: null } } } },
} as const

type MachineWithOverview = NonNullable<
  Awaited<ReturnType<typeof prisma.machine.findFirst<{ include: typeof overviewInclude }>>>
>

function toOverview({ readings, _count, ...machine }: MachineWithOverview): MachineOverview {
  const last = readings[0]
  return {
    ...machine,
    thresholds: machine.thresholds as Thresholds,
    lastReading: last
      ? {
          timestamp: last.timestamp.toISOString(),
          temperature: last.temperature,
          vibration: last.vibration,
          rate: last.rate,
          status: last.status,
        }
      : null,
    openAlertCount: _count.alerts,
    health: computeHealth(last?.status, _count.alerts),
  }
}

export async function machineRoutes(app: FastifyInstance) {
  app.get('/machines', async (): Promise<MachineOverview[]> => {
    const machines = await prisma.machine.findMany({ orderBy: { id: 'asc' }, include: overviewInclude })
    return machines.map(toOverview)
  })

  app.get<{ Params: { id: string } }>('/machines/:id', async (request, reply) => {
    const id = Number(request.params.id)
    if (!Number.isInteger(id)) return reply.code(400).send({ error: 'Invalid machine id' })

    const machine = await prisma.machine.findUnique({ where: { id }, include: overviewInclude })
    if (!machine) return reply.code(404).send({ error: 'Machine not found' })
    return toOverview(machine)
  })
}
