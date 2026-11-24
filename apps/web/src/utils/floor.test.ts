import { describe, expect, it } from 'vitest'
import { cyclePhase, healthColorToken } from './floor'

describe('healthColorToken', () => {
  it('associe chaque Health à son token de couleur, et à rien d’autre', () => {
    expect(healthColorToken('ok')).toBe('health-ok')
    expect(healthColorToken('warning')).toBe('health-warning')
    expect(healthColorToken('fault')).toBe('health-fault')
  })
})

describe('cyclePhase', () => {
  it('avance de 0 à 1 sur une période, puis recommence', () => {
    expect(cyclePhase(0, 4)).toBe(0)
    expect(cyclePhase(1, 4)).toBe(0.25)
    expect(cyclePhase(5, 4)).toBe(0.25)
  })

  it('applique un décalage, pour que plusieurs objets ne bougent pas en même temps', () => {
    expect(cyclePhase(0, 4, 0.5)).toBe(0.5)
    expect(cyclePhase(3, 4, 0.5)).toBe(0.25)
  })
})
