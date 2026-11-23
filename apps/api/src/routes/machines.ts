import type { FastifyInstance } from 'fastify'
import { readingRanges, type MachineOverview, type ReadingRange } from '@atelier/shared'
import { prisma } from '../db.ts'
import { overviewInclude, toOverview } from '../overview.ts'
import { readingHistory } from '../readings/history.ts'

const isReadingRange = (value: string): value is ReadingRange => (readingRanges as readonly string[]).includes(value)

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

  // GET /machines/:id/readings?range=24h : l'historique agrégé pour les courbes de la fiche machine.
  app.get<{ Params: { id: string }; Querystring: { range?: string } }>('/machines/:id/readings', async (request, reply) => {
    const id = Number(request.params.id)
    if (!Number.isInteger(id)) return reply.code(400).send({ error: 'Invalid machine id' })

    const range = request.query.range ?? '24h'
    if (!isReadingRange(range)) return reply.code(400).send({ error: `Invalid range, expected ${readingRanges.join(' | ')}` })

    const machine = await prisma.machine.findUnique({ where: { id }, select: { id: true } })
    if (!machine) return reply.code(404).send({ error: 'Machine not found' })

    return readingHistory(id, range)
  })
}
