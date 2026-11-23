import type { AlertSummary, AlertType } from '@atelier/shared'

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

/** Durée lisible : « 45 s », « 12 min », « 2 h 05 ». */
export function formatDuration(fromIso: string, toIso: string): string {
  const seconds = Math.max(0, Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 1000))
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}
