import { describe, expect, it } from 'vitest'
import { computeKpis, mergeSummaries, type ProductionSummary } from './kpi.ts'

describe('computeKpis', () => {
  // Une heure : 45 min de marche à 80 % de la cadence nominale, 5 min d'arrêt, 2 pannes pour 10 min au total.
  const hour: ProductionSummary = {
    runningSeconds: 2700,
    stoppedSeconds: 300,
    faultSeconds: 600,
    faultCount: 2,
    meanRunningRate: 24,
    nominalRate: 30,
  }

  it('calcule le TRS comme disponibilité × performance × qualité', () => {
    const kpis = computeKpis(hour)!

    expect(kpis.availability).toBeCloseTo(0.75)
    expect(kpis.performance).toBeCloseTo(0.8)
    expect(kpis.oee).toBeCloseTo(0.6)
  })

  it("calcule MTBF et MTTR sur les seules Faults : un Stop n'est pas une défaillance", () => {
    expect(computeKpis(hour)).toMatchObject({ mtbf: 1350, mttr: 300 })
  })

  it('ne donne ni MTBF ni MTTR sans Fault, et aucun KPI sans Reading', () => {
    expect(computeKpis({ ...hour, faultSeconds: 0, faultCount: 0 })).toMatchObject({ mtbf: null, mttr: null })
    expect(computeKpis({ ...hour, runningSeconds: 0, stoppedSeconds: 0, faultSeconds: 0 })).toBeNull()
  })
})

describe('mergeSummaries', () => {
  it('additionne les durées et pondère la performance par le temps de marche', () => {
    // Une presse à 100 % pendant 3 000 s, une CNC à 50 % pendant 1 000 s : (3000 × 1 + 1000 × 0,5) / 4000 = 87,5 %.
    const press = { runningSeconds: 3000, stoppedSeconds: 0, faultSeconds: 600, faultCount: 1, meanRunningRate: 30, nominalRate: 30 }
    const cnc = { runningSeconds: 1000, stoppedSeconds: 400, faultSeconds: 0, faultCount: 0, meanRunningRate: 3, nominalRate: 6 }

    const plant = computeKpis(mergeSummaries([press, cnc]))!

    expect(plant.performance).toBeCloseTo(0.875)
    expect(plant.availability).toBeCloseTo(4000 / 5000)
    expect(plant.mtbf).toBe(4000)
  })
})
