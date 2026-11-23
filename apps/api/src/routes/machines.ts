import type { FastifyInstance } from 'fastify'
import type { MachineOverview } from '@atelier/shared'
import { prisma } from '../db.ts'
import { overviewInclude, toOverview } from '../overview.ts'

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
