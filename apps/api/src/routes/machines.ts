import type { FastifyInstance } from 'fastify'
import { computeHealth, type MachineOverview, type Thresholds } from '@atelier/shared'
import { prisma } from '../db.ts'

export async function machineRoutes(app: FastifyInstance) {
  app.get('/machines', async (): Promise<MachineOverview[]> => {
    const machines = await prisma.machine.findMany({
      orderBy: { id: 'asc' },
      include: {
        // Dernier relevé seulement (l'index machineId + timestamp rend ça rapide).
        readings: { orderBy: { timestamp: 'desc' }, take: 1 },
        // Nombre d'alertes en cours (pas encore revenues à la normale).
        _count: { select: { alerts: { where: { clearedAt: null } } } },
      },
    })

    return machines.map(({ readings, _count, ...machine }) => {
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
    })
  })
}
