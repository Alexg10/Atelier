import type { FastifyInstance } from 'fastify'
import { readingInputSchema } from '@atelier/shared/schemas'
import { prisma } from '../db.ts'

export async function readingRoutes(app: FastifyInstance) {
  // Point d'entrée de la télémétrie : pour l'instant on stocke le relevé, sans plus.
  // La détection des dépassements (Alerts) et la diffusion en SSE viendront à l'étape 7.
  app.post('/readings', async (request, reply) => {
    const parsed = readingInputSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid reading', issues: parsed.error.issues })
    }

    const { timestamp, ...values } = parsed.data
    const reading = await prisma.reading.create({
      data: { ...values, timestamp: new Date(timestamp) },
    })
    return reply.code(201).send({ id: reading.id })
  })
}
