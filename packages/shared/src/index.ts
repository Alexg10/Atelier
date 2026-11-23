// Vocabulaire commun au front et au back (voir GLOSSARY.md).

/** Ce que la machine déclare d'elle-même. */
export type MachineStatus = 'running' | 'stopped' | 'fault'

/** Ce que l'app déduit (Status + alertes ouvertes) : pilote la couleur. */
export type MachineHealth = 'ok' | 'warning' | 'fault'

export type MachineType = 'press' | 'cnc' | 'conveyor' | 'robot' | 'oven'

export type Thresholds = {
  temperature: { max: number }
  vibration: { max: number }
  rate: { min: number }
}

export type ReadingValues = {
  timestamp: string
  temperature: number
  vibration: number
  rate: number
  status: MachineStatus
}

/** Une machine telle que le dashboard la reçoit : sa fiche + son dernier relevé + sa santé. */
export type MachineOverview = {
  id: number
  name: string
  type: MachineType
  line: string
  thresholds: Thresholds
  posX: number
  posZ: number
  rotation: number
  lastReading: ReadingValues | null
  openAlertCount: number
  health: MachineHealth
}

/** Règle de santé : une panne prime sur tout, puis toute alerte en cours met la machine en warning. */
export function computeHealth(status: MachineStatus | undefined, openAlertCount: number): MachineHealth {
  if (status === 'fault') return 'fault'
  if (openAlertCount > 0) return 'warning'
  return 'ok'
}

export * from './profiles.ts'

export type AlertType = 'temperature' | 'vibration' | 'rate' | 'fault'

/** Une alerte telle que le front la reçoit (dates en ISO). */
export type AlertSummary = {
  id: number
  machineId: number
  type: AlertType
  value: number | null
  createdAt: string
  acknowledgedAt: string | null
  clearedAt: string | null
}

/** Événements poussés par l'API sur le flux temps réel (nom de l'événement → contenu). */
export type StreamEvents = {
  machine: MachineOverview
  'alert-opened': AlertSummary
  'alert-cleared': AlertSummary
}

/** Périodes proposées sur la fiche machine. */
export const readingRanges = ['1h', '24h', '7d'] as const
export type ReadingRange = (typeof readingRanges)[number]

/** Moyenne des relevés d'une machine sur un intervalle (« bucket ») de temps. null : aucun relevé reçu pendant l'intervalle. */
export type ReadingBucket = {
  timestamp: string
  temperature: number | null
  vibration: number | null
  rate: number | null
}

export type ReadingHistory = {
  range: ReadingRange
  /** Durée de chaque bucket, en secondes. */
  bucketSeconds: number
  buckets: ReadingBucket[]
}

export const workOrderStatuses = ['todo', 'in_progress', 'done'] as const
export type WorkOrderStatus = (typeof workOrderStatuses)[number]
export const workOrderPriorities = ['low', 'medium', 'high'] as const
export type WorkOrderPriority = (typeof workOrderPriorities)[number]
export type UserRole = 'operator' | 'technician' | 'manager'

export type UserSummary = { id: number; name: string; role: UserRole }

/** Un ordre de maintenance tel que le front le reçoit (avec le nom de la machine et de l'Assignee, pour la liste). */
export type WorkOrderSummary = {
  id: number
  machineId: number
  machineName: string
  alertId: number | null
  title: string
  priority: WorkOrderPriority
  status: WorkOrderStatus
  assignee: UserSummary | null
  createdAt: string
  closedAt: string | null
}

/** Cycle de vie : à faire ⇄ en cours → terminé. Un ordre terminé ne bouge plus. */
const workOrderTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  todo: ['in_progress', 'done'],
  in_progress: ['todo', 'done'],
  done: [],
}

export function canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return from === to || workOrderTransitions[from].includes(to)
}
