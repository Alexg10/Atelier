import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { MachineOverview, WorkOrderSummary } from '@atelier/shared'
import { buildApp } from '../app.ts'
import { prisma } from '../db.ts'

// Tests d'intégration : vraie app Fastify, vrai Prisma, vraie base Postgres (de test). Seul le réseau est court-circuité.
const app = await buildApp({ logger: false })

beforeAll(() => app.ready())

afterAll(async () => {
  await app.close()
  await prisma.$disconnect()
})

// Chaque test part d'une base vide : il ne dépend ni de l'ordre des tests, ni des données de dev.
beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE "Machine", "User" RESTART IDENTITY CASCADE`
})

function createMachine() {
  return prisma.machine.create({
    data: {
      name: 'Presse P-01',
      type: 'press',
      line: 'A',
      thresholds: { temperature: { max: 90 }, vibration: { max: 6 }, rate: { min: 20 } },
      posX: 0,
      posZ: 0,
    },
  })
}

describe('GET /machines', () => {
  it("renvoie chaque machine avec son dernier relevé et sa Health", async () => {
    const machine = await createMachine()
    await prisma.reading.createMany({
      data: [
        { machineId: machine.id, timestamp: new Date('2026-11-24T10:00:00Z'), temperature: 60, vibration: 3, rate: 30, status: 'running' },
        { machineId: machine.id, timestamp: new Date('2026-11-24T10:01:00Z'), temperature: 0, vibration: 0, rate: 0, status: 'fault' },
      ],
    })

    // app.inject : une requête HTTP simulée, sans ouvrir de port.
    const response = await app.inject({ method: 'GET', url: '/machines' })

    expect(response.statusCode).toBe(200)
    const [overview] = response.json<MachineOverview[]>()
    expect(overview).toMatchObject({ name: 'Presse P-01', health: 'fault', lastReading: { status: 'fault' } })
  })
})

describe('POST /work-orders', () => {
  it("crée l'ordre depuis une alerte, l'acquitte, et refuse un second ordre sur la même alerte", async () => {
    const machine = await createMachine()
    const alert = await prisma.alert.create({ data: { machineId: machine.id, type: 'temperature', value: 95 } })
    const body = { machineId: machine.id, alertId: alert.id, title: 'Vérifier le refroidissement' }

    const created = await app.inject({ method: 'POST', url: '/work-orders', payload: body })

    expect(created.statusCode).toBe(201)
    expect(created.json<WorkOrderSummary>()).toMatchObject({ alertId: alert.id, status: 'todo', machineName: 'Presse P-01' })
    // L'effet de bord en base : la transaction a aussi acquitté l'alerte.
    const acknowledged = await prisma.alert.findUniqueOrThrow({ where: { id: alert.id } })
    expect(acknowledged.acknowledgedAt).not.toBeNull()

    const duplicate = await app.inject({ method: 'POST', url: '/work-orders', payload: body })
    expect(duplicate.statusCode).toBe(409)
  })
})

describe('PATCH /work-orders/:id', () => {
  it('ferme un ordre puis refuse de le rouvrir', async () => {
    const machine = await createMachine()
    const workOrder = await prisma.workOrder.create({ data: { machineId: machine.id, title: 'Graissage', status: 'in_progress' } })
    const url = `/work-orders/${workOrder.id}`

    const done = await app.inject({ method: 'PATCH', url, payload: { status: 'done' } })
    expect(done.statusCode).toBe(200)
    expect(done.json<WorkOrderSummary>().closedAt).not.toBeNull()

    const reopened = await app.inject({ method: 'PATCH', url, payload: { status: 'todo' } })
    expect(reopened.statusCode).toBe(409)
  })
})
