// Indicateurs industriels d'une Machine sur une période (voir GLOSSARY.md : OEE, MTBF, MTTR).
import type { ReadingRange } from './index.ts'

/** Ce qu'il faut savoir d'une période pour calculer les KPI (durées en secondes). */
export type ProductionSummary = {
  runningSeconds: number
  stoppedSeconds: number
  faultSeconds: number
  /** Nombre de Faults commencées pendant la période. */
  faultCount: number
  /** Rate moyenne pendant que la machine tourne. */
  meanRunningRate: number
  /** Rate attendue d'une machine qui tourne normalement (voir machineProfiles). */
  nominalRate: number
}

export type Kpis = {
  availability: number
  performance: number
  quality: number
  oee: number
  /** Temps moyen de marche entre deux Faults (s). null : aucune Fault sur la période. */
  mtbf: number | null
  /** Temps moyen de réparation d'une Fault (s). null : aucune Fault sur la période. */
  mttr: number | null
}

/**
 * Additionne les résumés de plusieurs Machines (le total de l'atelier). Les Rates nominales diffèrent d'un type
 * de machine à l'autre : on ne moyenne donc pas des Rates, mais des performances, pondérées par le temps de marche.
 */
export function mergeSummaries(summaries: ProductionSummary[]): ProductionSummary {
  let runningSeconds = 0
  let weightedPerformance = 0
  const merged = { stoppedSeconds: 0, faultSeconds: 0, faultCount: 0 }

  for (const summary of summaries) {
    runningSeconds += summary.runningSeconds
    weightedPerformance += summary.runningSeconds * (summary.meanRunningRate / summary.nominalRate)
    merged.stoppedSeconds += summary.stoppedSeconds
    merged.faultSeconds += summary.faultSeconds
    merged.faultCount += summary.faultCount
  }

  // Rate exprimée en part de la nominale : nominalRate = 1, donc meanRunningRate est directement la performance.
  const meanRunningRate = runningSeconds > 0 ? weightedPerformance / runningSeconds : 0
  return { ...merged, runningSeconds, meanRunningRate, nominalRate: 1 }
}

/** null : la période ne contient aucun Reading, il n'y a rien à mesurer. */
export function computeKpis(summary: ProductionSummary): Kpis | null {
  const totalSeconds = summary.runningSeconds + summary.stoppedSeconds + summary.faultSeconds
  if (totalSeconds === 0) return null

  // Disponibilité : part du temps où la machine produit. Un Stop compte comme une perte, au même titre qu'une Fault.
  const availability = summary.runningSeconds / totalSeconds
  // Performance : cadence réelle / cadence nominale, plafonnée à 100 % (le bruit du simulateur peut la dépasser).
  const performance = Math.min(summary.meanRunningRate / summary.nominalRate, 1)
  // Qualité : la télémétrie ne remonte pas les pièces rebutées, on la suppose parfaite.
  const quality = 1

  const hasFaults = summary.faultCount > 0
  return {
    availability,
    performance,
    quality,
    oee: availability * performance * quality,
    // MTBF et MTTR ne parlent que de fiabilité : un Stop n'est pas une défaillance, il n'entre dans aucun des deux.
    mtbf: hasFaults ? summary.runningSeconds / summary.faultCount : null,
    mttr: hasFaults ? summary.faultSeconds / summary.faultCount : null,
  }
}

/** Réponse de GET /kpis : les KPI de chaque Machine et ceux de l'atelier entier (null : aucun Reading sur la période). */
export type KpiReport = {
  range: ReadingRange
  plant: Kpis | null
  machines: { machineId: number; kpis: Kpis | null }[]
}
