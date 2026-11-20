import { z } from 'zod'

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
