import type { WorkOrderPriority, WorkOrderStatus } from '@atelier/shared'

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
}

export const workOrderPriorityLabels: Record<WorkOrderPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
}
