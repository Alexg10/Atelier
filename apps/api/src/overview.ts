// Conversion Prisma → MachineOverview, partagée par les routes machines et par le flux temps réel.
import { computeHealth, type AlertSummary, type MachineOverview, type Thresholds } from '@atelier/shared'
import { prisma } from './db.ts'
import type { Alert } from './generated/prisma/client.ts'

export const overviewInclude = {
  // Dernier relevé seulement (l'index machineId + timestamp rend ça rapide).
  readings: { orderBy: { timestamp: 'desc' }, take: 1 },
  // Nombre d'alertes en cours (pas encore revenues à la normale).
  _count: { select: { alerts: { where: { clearedAt: null } } } },
} as const

type MachineWithOverview = NonNullable<
  Awaited<ReturnType<typeof prisma.machine.findFirst<{ include: typeof overviewInclude }>>>
>

export function toOverview({ readings, _count, ...machine }: MachineWithOverview): MachineOverview {
  const last = readings[0]
  return {
    ...machine,
    thresholds: machine.thresholds as Thresholds,
    lastReading: last
      ? {
          timestamp: last.timestamp.toISOString(),
          temperature: last.temperature,
          vibration: last.vibration,
          rate: last.rate,
          status: last.status,
        }
      : null,
    openAlertCount: _count.alerts,
    health: computeHealth(last?.status, _count.alerts),
  }
}

export function toAlertSummary(alert: Alert): AlertSummary {
  return {
    id: alert.id,
    machineId: alert.machineId,
    type: alert.type,
    value: alert.value,
    createdAt: alert.createdAt.toISOString(),
    acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
    clearedAt: alert.clearedAt?.toISOString() ?? null,
  }
}
