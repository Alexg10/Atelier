import type { FastifyInstance } from 'fastify'
import type { Thresholds } from '@atelier/shared'
import { readingInputSchema } from '@atelier/shared/schemas'
import { abnormalTypes, diffAlerts, triggeringValue } from '../alerts/rules.ts'
import { prisma } from '../db.ts'
import { events } from '../events.ts'
import { overviewInclude, toAlertSummary, toOverview } from '../overview.ts'

export async function readingRoutes(app: FastifyInstance) {
  // Point d'entrée de la télémétrie : on stocke le relevé, on applique les règles d'alerte, puis on publie.
  app.post('/readings', async (request, reply) => {
    const parsed = readingInputSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid reading', issues: parsed.error.issues })
    }

    const { machineId, timestamp: isoTimestamp, ...values } = parsed.data
    const timestamp = new Date(isoTimestamp)

    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      select: { thresholds: true, alerts: { where: { clearedAt: null } } },
    })
    if (!machine) return reply.code(404).send({ error: 'Machine not found' })

    const abnormal = abnormalTypes(machine.thresholds as Thresholds, values)
    const { toOpen, toClear } = diffAlerts(
      abnormal,
      machine.alerts.map((alert) => alert.type),
    )

    // Tout ou rien : le relevé et les changements d'alertes sont enregistrés ensemble.
    const { reading, opened, cleared } = await prisma.$transaction(async (tx) => {
      const reading = await tx.reading.create({ data: { machineId, timestamp, ...values } })
      const opened = await Promise.all(
        toOpen.map((type) =>
          tx.alert.create({ data: { machineId, type, value: triggeringValue(type, values), createdAt: timestamp } }),
        ),
      )
      const cleared = await Promise.all(
        machine.alerts
          .filter((alert) => toClear.includes(alert.type))
          .map((alert) => tx.alert.update({ where: { id: alert.id }, data: { clearedAt: timestamp } })),
      )
      return { reading, opened, cleared }
    })

    // Publication pour le temps réel : les alertes d'abord, puis la machine à jour (Health recalculée).
    for (const alert of opened) events.emit('alert-opened', toAlertSummary(alert))
    for (const alert of cleared) events.emit('alert-cleared', toAlertSummary(alert))
    const overview = await prisma.machine.findUniqueOrThrow({ where: { id: machineId }, include: overviewInclude })
    events.emit('machine', toOverview(overview))

    return reply.code(201).send({ id: reading.id, opened: opened.length, cleared: cleared.length })
  })
}
