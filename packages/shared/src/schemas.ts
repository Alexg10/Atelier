import { z } from 'zod'
import { workOrderPriorities, workOrderStatuses } from './index.ts'

/** Relevé envoyé par une machine (ou le simulateur) à POST /readings. */
export const readingInputSchema = z.object({
  machineId: z.number().int().positive(),
  timestamp: z.iso.datetime(),
  temperature: z.number(),
  vibration: z.number().nonnegative(),
  rate: z.number().nonnegative(),
  status: z.enum(['running', 'stopped', 'fault']),
})

export type ReadingInput = z.infer<typeof readingInputSchema>

// Partagés : l'API valide les requêtes avec, le formulaire du front affiche les mêmes erreurs avant l'envoi.
export const workOrderPrioritySchema = z.enum(workOrderPriorities)
export const workOrderStatusSchema = z.enum(workOrderStatuses)

export const workOrderCreateSchema = z.object({
  machineId: z.number().int().positive({ error: 'Choisissez une machine' }),
  alertId: z.number().int().positive().nullable().default(null),
  title: z
    .string()
    .trim()
    .min(3, { error: 'Le titre doit faire au moins 3 caractères' })
    .max(120, { error: 'Le titre doit faire au plus 120 caractères' }),
  priority: workOrderPrioritySchema.default('medium'),
  assigneeId: z.number().int().positive().nullable().default(null),
})

export type WorkOrderCreateInput = z.input<typeof workOrderCreateSchema>

/** Modification partielle : seuls les champs envoyés changent. */
export const workOrderUpdateSchema = z
  .object({
    title: workOrderCreateSchema.shape.title,
    priority: workOrderPrioritySchema,
    status: workOrderStatusSchema,
    assigneeId: z.number().int().positive().nullable(),
  })
  .partial()

export type WorkOrderUpdateInput = z.infer<typeof workOrderUpdateSchema>
