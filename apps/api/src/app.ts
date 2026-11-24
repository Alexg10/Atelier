import Fastify from 'fastify'
import { prisma } from './db.ts'
import { alertRoutes } from './routes/alerts.ts'
import { kpiRoutes } from './routes/kpis.ts'
import { machineRoutes } from './routes/machines.ts'
import { readingRoutes } from './routes/readings.ts'
import { streamRoutes } from './routes/stream.ts'
import { userRoutes } from './routes/users.ts'
import { workOrderRoutes } from './routes/workOrders.ts'

// Construire l'app sans la démarrer : server.ts l'écoute sur un port, les tests l'appellent avec app.inject().
export async function buildApp({ logger = true } = {}) {
  const app = Fastify({ logger })

  app.get('/health', async () => {
    const machineCount = await prisma.machine.count()
    return { status: 'ok', machineCount }
  })

  // Chaque groupe de routes est un plugin Fastify, enregistré ici.
  await app.register(machineRoutes)
  await app.register(readingRoutes)
  await app.register(alertRoutes)
  await app.register(streamRoutes)
  await app.register(userRoutes)
  await app.register(workOrderRoutes)
  await app.register(kpiRoutes)

  return app
}
