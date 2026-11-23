// Règles d'alerte (voir GLOSSARY.md) : fonctions pures, sans base de données, faciles à tester (étape 12).
import type { AlertType, MachineStatus, Thresholds } from '@atelier/shared'

type ReadingValues = {
  temperature: number
  vibration: number
  rate: number
  status: MachineStatus
}

/** Les situations anormales que montre ce relevé, une par type d'alerte. */
export function abnormalTypes(thresholds: Thresholds, reading: ReadingValues): AlertType[] {
  const types: AlertType[] = []
  if (reading.status === 'fault') types.push('fault')
  if (reading.temperature > thresholds.temperature.max) types.push('temperature')
  if (reading.vibration > thresholds.vibration.max) types.push('vibration')
  // La cadence n'est surveillée que si la machine tourne : un arrêt ou une panne n'est pas une sous-cadence.
  if (reading.status === 'running' && reading.rate < thresholds.rate.min) types.push('rate')
  return types
}

/**
 * Compare la situation du relevé aux alertes déjà en cours.
 * - toOpen : anormal maintenant, sans alerte en cours → on ouvre une alerte (une seule par épisode).
 * - toClear : alerte en cours, mais redevenu normal → retour à la normale.
 */
export function diffAlerts(abnormal: AlertType[], openTypes: AlertType[]) {
  return {
    toOpen: abnormal.filter((type) => !openTypes.includes(type)),
    toClear: openTypes.filter((type) => !abnormal.includes(type)),
  }
}

/** Valeur qui a déclenché l'alerte (aucune pour une panne). */
export function triggeringValue(type: AlertType, reading: ReadingValues): number | null {
  return type === 'fault' ? null : reading[type]
}
