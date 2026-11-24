import { describe, expect, it } from 'vitest'
import type { Thresholds } from '@atelier/shared'
import { abnormalTypes, diffAlerts, triggeringValue } from './rules.ts'

const thresholds: Thresholds = { temperature: { max: 90 }, vibration: { max: 6 }, rate: { min: 20 } }
const normal = { temperature: 60, vibration: 3, rate: 30, status: 'running' as const }

describe('abnormalTypes', () => {
  it('ne signale rien pour un relevé normal', () => {
    expect(abnormalTypes(thresholds, normal)).toEqual([])
  })

  it('signale chaque seuil franchi', () => {
    expect(abnormalTypes(thresholds, { ...normal, temperature: 95, vibration: 7 })).toEqual(['temperature', 'vibration'])
  })

  it("ne surveille la cadence que si la machine tourne : un arrêt n'est pas une sous-cadence", () => {
    expect(abnormalTypes(thresholds, { ...normal, rate: 0, status: 'stopped' })).toEqual([])
    expect(abnormalTypes(thresholds, { ...normal, rate: 5, status: 'running' })).toEqual(['rate'])
  })

  it('signale une panne sans y ajouter la cadence nulle', () => {
    expect(abnormalTypes(thresholds, { ...normal, rate: 0, status: 'fault' })).toEqual(['fault'])
  })
})

describe('diffAlerts', () => {
  it("ouvre une alerte quand l'anomalie apparaît", () => {
    expect(diffAlerts(['temperature'], [])).toEqual({ toOpen: ['temperature'], toClear: [] })
  })

  it("n'ouvre pas de doublon tant que l'épisode continue", () => {
    expect(diffAlerts(['temperature'], ['temperature'])).toEqual({ toOpen: [], toClear: [] })
  })

  it("clôt l'alerte au retour à la normale", () => {
    expect(diffAlerts([], ['temperature'])).toEqual({ toOpen: [], toClear: ['temperature'] })
  })
})

describe('triggeringValue', () => {
  it('renvoie la mesure en cause, et rien pour une panne', () => {
    expect(triggeringValue('temperature', { ...normal, temperature: 95 })).toBe(95)
    expect(triggeringValue('fault', normal)).toBeNull()
  })
})
