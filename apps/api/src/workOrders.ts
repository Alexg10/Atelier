// Conversion Prisma → WorkOrderSummary, avec le nom de la machine et de l'Assignee pour l'affichage.
import type { UserRole, WorkOrderSummary } from '@atelier/shared'
import type { Prisma } from './generated/prisma/client.ts'

export const workOrderInclude = {
  machine: { select: { name: true } },
  assignee: { select: { id: true, name: true, role: true } },
} as const satisfies Prisma.WorkOrderInclude

type WorkOrderWithRelations = Prisma.WorkOrderGetPayload<{ include: typeof workOrderInclude }>

export function toWorkOrderSummary({ machine, assignee, ...workOrder }: WorkOrderWithRelations): WorkOrderSummary {
  return {
    id: workOrder.id,
    machineId: workOrder.machineId,
    machineName: machine.name,
    alertId: workOrder.alertId,
    title: workOrder.title,
    priority: workOrder.priority,
    status: workOrder.status,
    assignee: assignee ? { ...assignee, role: assignee.role as UserRole } : null,
    createdAt: workOrder.createdAt.toISOString(),
    closedAt: workOrder.closedAt?.toISOString() ?? null,
  }
}
