import { describe, expect, it } from 'vitest'
import { canTransition, computeHealth } from './index.ts'

describe('computeHealth', () => {
  it('met une machine en panne en fault, même sans alerte', () => {
    expect(computeHealth('fault', 0)).toBe('fault')
  })

  it('met une machine en marche avec une alerte en cours en warning', () => {
    expect(computeHealth('running', 1)).toBe('warning')
  })

  it('met une machine sans relevé ni alerte en ok', () => {
    expect(computeHealth(undefined, 0)).toBe('ok')
  })
})

describe('canTransition', () => {
  // it.each : un même test sur plusieurs cas, chacun affiché séparément dans le rapport.
  it.each([
    ['todo', 'in_progress'],
    ['in_progress', 'todo'],
    ['in_progress', 'done'],
    ['todo', 'done'],
  ] as const)('autorise %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  it.each([
    ['done', 'todo'],
    ['done', 'in_progress'],
  ] as const)('interdit %s → %s (un ordre terminé est figé)', (from, to) => {
    expect(canTransition(from, to)).toBe(false)
  })
})
