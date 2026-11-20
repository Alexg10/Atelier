import type { MachineType, Thresholds } from './index.ts'

/** Valeurs typiques d'une machine qui tourne normalement, et ses seuils par défaut. */
export type MachineProfile = {
  nominal: { temperature: number; vibration: number; rate: number }
  thresholds: Thresholds
}

export const machineProfiles: Record<MachineType, MachineProfile> = {
  press: {
    nominal: { temperature: 60, vibration: 3, rate: 30 },
    thresholds: { temperature: { max: 80 }, vibration: { max: 6 }, rate: { min: 20 } },
  },
  cnc: {
    nominal: { temperature: 50, vibration: 2, rate: 6 },
    thresholds: { temperature: { max: 70 }, vibration: { max: 4 }, rate: { min: 4 } },
  },
  conveyor: {
    nominal: { temperature: 35, vibration: 1.5, rate: 60 },
    thresholds: { temperature: { max: 55 }, vibration: { max: 3 }, rate: { min: 40 } },
  },
  robot: {
    nominal: { temperature: 45, vibration: 1.8, rate: 15 },
    thresholds: { temperature: { max: 65 }, vibration: { max: 3.5 }, rate: { min: 10 } },
  },
  oven: {
    nominal: { temperature: 220, vibration: 0.8, rate: 12 },
    thresholds: { temperature: { max: 250 }, vibration: { max: 2 }, rate: { min: 8 } },
  },
}
