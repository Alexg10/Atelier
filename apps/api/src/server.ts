import Fastify from 'fastify'
import { prisma } from './db.ts'
import { machineRoutes } from './routes/machines.ts'
import { readingRoutes } from './routes/readings.ts'
import { streamRoutes } from './routes/stream.ts'

const app = Fastify({ logger: true })

app.get('/health', async () => {
  const machineCount = await prisma.machine.count()
  return { status: 'ok', machineCount }
})

// Chaque groupe de routes est un plugin Fastify, enregistré ici.
await app.register(machineRoutes)
await app.register(readingRoutes)
await app.register(streamRoutes)

const port = Number(process.env.API_PORT ?? 3001)
await app.listen({ port, host: '0.0.0.0' })
