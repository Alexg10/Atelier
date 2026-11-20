import type { MachineOverview } from '@atelier/shared'

export type Metric = {
  key: 'temperature' | 'vibration' | 'rate'
  label: string
  value: number
  unit: string
  limit: string
  outOfRange: boolean
}

/** Transforme le dernier relevé d'une machine en trois mesures prêtes à afficher. */
export function buildMetrics(machine: MachineOverview): Metric[] {
  const reading = machine.lastReading
  if (!reading) return []

  const { thresholds } = machine
  return [
    {
      key: 'temperature',
      label: 'Température',
      value: reading.temperature,
      unit: '°C',
      limit: `max ${thresholds.temperature.max}`,
      outOfRange: reading.temperature > thresholds.temperature.max,
    },
    {
      key: 'vibration',
      label: 'Vibration',
      value: reading.vibration,
      unit: 'mm/s',
      limit: `max ${thresholds.vibration.max}`,
      outOfRange: reading.vibration > thresholds.vibration.max,
    },
    {
      key: 'rate',
      label: 'Cadence',
      value: reading.rate,
      unit: 'p/min',
      limit: `min ${thresholds.rate.min}`,
      // La cadence n'est surveillée que si la machine tourne (un arrêt n'est pas une sous-cadence).
      outOfRange: reading.status === 'running' && reading.rate < thresholds.rate.min,
    },
  ]
}
