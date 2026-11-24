// Temps passé dans chaque Status, par Machine : la matière première des KPI.
import { machineProfiles, readingIntervalSeconds, type ProductionSummary } from '@atelier/shared'
import { prisma } from '../db.ts'

// Au-delà d'une minute sans Reading, la Machine n'était pas supervisée (simulateur arrêté) : ce trou ne compte pas.
const MAX_READING_SECONDS = 60

type StatusRow = { machineId: number; status: 'running' | 'stopped' | 'fault'; seconds: number; meanRate: number | null }

export async function productionSummaries(from: Date) {
  // lead() lit le timestamp du Reading suivant de la même Machine : chaque Reading « dure » jusqu'au suivant.
  // Les Readings ne sont pas réguliers (1 par minute dans le seed, 1 toutes les 5 s avec le simulateur) : compter ne suffit pas.
  const [machines, rows, faultGroups] = await Promise.all([
    prisma.machine.findMany({ select: { id: true, type: true }, orderBy: { id: 'asc' } }),
    prisma.$queryRaw<StatusRow[]>`
      SELECT "machineId", status::text AS status,
             sum(least(coalesce(extract(epoch FROM next_timestamp - "timestamp"), ${readingIntervalSeconds}), ${MAX_READING_SECONDS}))::float8 AS seconds,
             avg(rate)::float8 AS "meanRate"
      FROM (
        SELECT "machineId", status, rate, "timestamp",
               lead("timestamp") OVER (PARTITION BY "machineId" ORDER BY "timestamp") AS next_timestamp
        FROM "Reading"
        WHERE "timestamp" >= ${from}::timestamp
      ) AS timed
      GROUP BY 1, 2
    `,
    // Une Alert « fault » couvre un épisode de panne entier : leur nombre est le nombre de Faults.
    prisma.alert.groupBy({ by: ['machineId'], where: { type: 'fault', createdAt: { gte: from } }, _count: true }),
  ])

  return machines.map((machine) => {
    const row = (status: StatusRow['status']) => rows.find((r) => r.machineId === machine.id && r.status === status)
    const summary: ProductionSummary = {
      runningSeconds: row('running')?.seconds ?? 0,
      stoppedSeconds: row('stopped')?.seconds ?? 0,
      faultSeconds: row('fault')?.seconds ?? 0,
      faultCount: faultGroups.find((group) => group.machineId === machine.id)?._count ?? 0,
      meanRunningRate: row('running')?.meanRate ?? 0,
      nominalRate: machineProfiles[machine.type].nominal.rate,
    }
    return { machineId: machine.id, summary }
  })
}
