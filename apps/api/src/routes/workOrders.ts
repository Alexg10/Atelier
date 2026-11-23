import type { FastifyInstance } from 'fastify'
import { canTransition } from '@atelier/shared'
import { workOrderCreateSchema, workOrderStatusSchema, workOrderUpdateSchema } from '@atelier/shared/schemas'
import { prisma } from '../db.ts'
import { toWorkOrderSummary, workOrderInclude } from '../workOrders.ts'

type IdParams = { Params: { id: string } }

function parseId(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : Number.NaN
}

export async function workOrderRoutes(app: FastifyInstance) {
  // GET /work-orders?status=todo&machineId=3&assigneeId=2 : chaque filtre est optionnel.
  app.get<{ Querystring: { status?: string; machineId?: string; assigneeId?: string } }>(
    '/work-orders',
    async (request, reply) => {
      const status = request.query.status ? workOrderStatusSchema.safeParse(request.query.status) : undefined
      const machineId = parseId(request.query.machineId)
      const assigneeId = parseId(request.query.assigneeId)
      if (status?.success === false || Number.isNaN(machineId) || Number.isNaN(assigneeId)) {
        return reply.code(400).send({ error: 'Invalid filters' })
      }

      const workOrders = await prisma.workOrder.findMany({
        where: { status: status?.data, machineId, assigneeId },
        include: workOrderInclude,
        orderBy: { createdAt: 'desc' },
      })
      return workOrders.map(toWorkOrderSummary)
    },
  )

  app.get<IdParams>('/work-orders/:id', async (request, reply) => {
    const id = parseId(request.params.id)
    if (!id) return reply.code(400).send({ error: 'Invalid work order id' })
    const workOrder = await prisma.workOrder.findUnique({ where: { id }, include: workOrderInclude })
    if (!workOrder) return reply.code(404).send({ error: 'Work order not found' })
    return toWorkOrderSummary(workOrder)
  })

  app.post('/work-orders', async (request, reply) => {
    const parsed = workOrderCreateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid work order', issues: parsed.error.issues })
    const input = parsed.data

    if (input.alertId !== null) {
      const alert = await prisma.alert.findUnique({ where: { id: input.alertId }, include: { workOrder: true } })
      if (!alert || alert.machineId !== input.machineId) {
        return reply.code(400).send({ error: 'Alert not found on this machine' })
      }
      // Une Alert a au plus un WorkOrder.
      if (alert.workOrder) return reply.code(409).send({ error: 'Alert already has a work order' })
    }

    // Créer un ordre depuis une alerte vaut acquittement : les deux écritures réussissent ou échouent ensemble.
    const workOrder = await prisma.$transaction(async (tx) => {
      if (input.alertId !== null) {
        await tx.alert.updateMany({
          where: { id: input.alertId, acknowledgedAt: null },
          data: { acknowledgedAt: new Date() },
        })
      }
      return tx.workOrder.create({ data: input, include: workOrderInclude })
    })

    return reply.code(201).send(toWorkOrderSummary(workOrder))
  })

  app.patch<IdParams>('/work-orders/:id', async (request, reply) => {
    const id = parseId(request.params.id)
    if (!id) return reply.code(400).send({ error: 'Invalid work order id' })
    const parsed = workOrderUpdateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid work order', issues: parsed.error.issues })
    const changes = parsed.data

    const current = await prisma.workOrder.findUnique({ where: { id } })
    if (!current) return reply.code(404).send({ error: 'Work order not found' })

    // Un ordre terminé est figé ; sinon, seules les transitions prévues sont permises.
    if (current.status === 'done') return reply.code(409).send({ error: 'Work order is done' })
    if (changes.status && !canTransition(current.status, changes.status)) {
      return reply.code(409).send({ error: `Cannot go from ${current.status} to ${changes.status}` })
    }

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: { ...changes, closedAt: changes.status === 'done' ? new Date() : undefined },
      include: workOrderInclude,
    })
    return toWorkOrderSummary(workOrder)
  })

  // Suppression réservée aux ordres pas encore commencés (une erreur de saisie) : le reste fait partie de l'historique.
  app.delete<IdParams>('/work-orders/:id', async (request, reply) => {
    const id = parseId(request.params.id)
    if (!id) return reply.code(400).send({ error: 'Invalid work order id' })
    const current = await prisma.workOrder.findUnique({ where: { id } })
    if (!current) return reply.code(404).send({ error: 'Work order not found' })
    if (current.status !== 'todo') return reply.code(409).send({ error: 'Only todo work orders can be deleted' })

    await prisma.workOrder.delete({ where: { id } })
    return reply.code(204).send()
  })
}
