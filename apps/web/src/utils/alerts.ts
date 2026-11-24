import type { AlertSummary, AlertType } from '@atelier/shared'
import { formatSeconds } from './format'

export const alertTypeLabels: Record<AlertType, string> = {
  temperature: 'Surchauffe',
  vibration: 'Vibrations excessives',
  rate: 'Cadence trop basse',
  fault: 'Panne',
}

const alertUnits: Record<AlertType, string> = { temperature: '°C', vibration: 'mm/s', rate: 'p/min', fault: '' }

/** Valeur qui a déclenché l'alerte, avec son unité (une panne n'a pas de valeur). */
export function formatTriggeringValue(alert: AlertSummary): string | null {
  if (alert.value === null) return null
  return `${Math.round(alert.value * 10) / 10} ${alertUnits[alert.type]}`
}

/** Durée de l'alerte, de son ouverture à son retour à la normale. */
export function formatDuration(fromIso: string, toIso: string): string {
  return formatSeconds((Date.parse(toIso) - Date.parse(fromIso)) / 1000)
}
