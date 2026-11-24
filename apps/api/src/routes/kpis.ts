import type { FastifyInstance } from 'fastify'
import { computeKpis, mergeSummaries, readingRanges, type KpiReport, type ReadingRange } from '@atelier/shared'
import { rangeStart } from '../readings/history.ts'
import { productionSummaries } from '../readings/production.ts'

const isReadingRange = (value: string): value is ReadingRange => (readingRanges as readonly string[]).includes(value)

export async function kpiRoutes(app: FastifyInstance) {
  // GET /kpis?range=24h : TRS, MTBF et MTTR de chaque Machine et de l'atelier sur la période.
  app.get<{ Querystring: { range?: string } }>('/kpis', async (request, reply): Promise<KpiReport> => {
    const range = request.query.range ?? '24h'
    if (!isReadingRange(range)) return reply.code(400).send({ error: `Invalid range, expected ${readingRanges.join(' | ')}` })

    const machines = await productionSummaries(rangeStart(range))
    return {
      range,
      plant: computeKpis(mergeSummaries(machines.map(({ summary }) => summary))),
      machines: machines.map(({ machineId, summary }) => ({ machineId, kpis: computeKpis(summary) })),
    }
  })
}
