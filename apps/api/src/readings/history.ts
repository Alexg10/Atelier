// Agrégation de l'historique : Postgres regroupe les relevés par intervalles de temps et renvoie une moyenne par intervalle.
import type { ReadingBucket, ReadingHistory, ReadingRange } from '@atelier/shared'
import { prisma } from '../db.ts'

const HOUR_MS = 60 * 60 * 1000

// Chaque période vise une centaine de points au plus : assez pour une courbe lisible, sans envoyer des milliers de relevés.
const rangeConfig: Record<ReadingRange, { durationMs: number; bucketSeconds: number }> = {
  '1h': { durationMs: HOUR_MS, bucketSeconds: 60 }, // 60 points d'1 min
  '24h': { durationMs: 24 * HOUR_MS, bucketSeconds: 15 * 60 }, // 96 points de 15 min
  '7d': { durationMs: 7 * 24 * HOUR_MS, bucketSeconds: 2 * 60 * 60 }, // 84 points de 2 h
}

/** Début de la période : la même définition de « 24 h » pour les courbes et pour les KPI. */
export function rangeStart(range: ReadingRange, now = new Date()): Date {
  return new Date(now.getTime() - rangeConfig[range].durationMs)
}

type BucketRow = { bucket: Date; temperature: number | null; vibration: number | null; rate: number | null }

export async function readingHistory(machineId: number, range: ReadingRange, now = new Date()): Promise<ReadingHistory> {
  const { bucketSeconds } = rangeConfig[range]
  const from = rangeStart(range, now)

  // bins : tous les intervalles de la période (generate_series), même ceux sans relevé.
  // stats : date_bin arrondit chaque timestamp au début de son intervalle ; GROUP BY fait une ligne par intervalle.
  // LEFT JOIN : un intervalle sans relevé garde des valeurs NULL, pour que la courbe montre un trou au lieu de relier les points.
  // Le tag $queryRaw transforme chaque ${…} en paramètre SQL ($1, $2…) : pas d'injection possible.
  const rows = await prisma.$queryRaw<BucketRow[]>`
    WITH params AS (
      SELECT make_interval(secs => ${bucketSeconds}::int) AS step, TIMESTAMP '2000-01-01' AS origin
    ),
    bins AS (
      SELECT generate_series(date_bin(step, ${from}::timestamp, origin), date_bin(step, ${now}::timestamp, origin), step) AS bucket
      FROM params
    ),
    stats AS (
      SELECT date_bin(step, "timestamp", origin) AS bucket,
             avg(temperature)::float8 AS temperature,
             avg(vibration)::float8 AS vibration,
             avg(rate)::float8 AS rate
      FROM "Reading", params
      WHERE "machineId" = ${machineId} AND "timestamp" >= ${from}::timestamp
      GROUP BY 1
    )
    SELECT bins.bucket, stats.temperature, stats.vibration, stats.rate
    FROM bins LEFT JOIN stats USING (bucket)
    ORDER BY bins.bucket`

  const buckets: ReadingBucket[] = rows.map((row) => ({
    timestamp: row.bucket.toISOString(),
    temperature: row.temperature,
    vibration: row.vibration,
    rate: row.rate,
  }))

  return { range, bucketSeconds, buckets }
}
