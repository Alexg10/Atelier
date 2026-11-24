import { describe, expect, it } from 'vitest'
import type { AlertSummary } from '@atelier/shared'
import { formatDuration, formatTriggeringValue } from './alerts'

describe('formatDuration', () => {
  const start = '2026-11-23T10:00:00.000Z'

  it.each([
    ['2026-11-23T10:00:45.000Z', '45 s'],
    ['2026-11-23T10:12:00.000Z', '12 min'],
    ['2026-11-23T12:05:00.000Z', '2 h 05'],
  ])('formate la durée jusqu’à %s en « %s »', (end, expected) => {
    expect(formatDuration(start, end)).toBe(expected)
  })

  it('ne renvoie jamais une durée négative', () => {
    expect(formatDuration(start, '2026-11-23T09:59:00.000Z')).toBe('0 s')
  })
})

describe('formatTriggeringValue', () => {
  const alert: AlertSummary = {
    id: 1,
    machineId: 1,
    type: 'temperature',
    value: 97.04,
    createdAt: '2026-11-23T10:00:00.000Z',
    acknowledgedAt: null,
    clearedAt: null,
  }

  it("arrondit au dixième et ajoute l'unité", () => {
    expect(formatTriggeringValue(alert)).toBe('97 °C')
  })

  it("n'affiche rien pour une panne (pas de valeur)", () => {
    expect(formatTriggeringValue({ ...alert, type: 'fault', value: null })).toBeNull()
  })
})
