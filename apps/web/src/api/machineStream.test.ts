import { describe, expect, it } from 'vitest'
import { parseStreamData } from './machineStream'

describe('parseStreamData', () => {
  it('lit le JSON d’un message SSE', () => {
    expect(parseStreamData<'alert-cleared'>('{"id":3,"machineId":1}')).toEqual({ id: 3, machineId: 1 })
  })

  it("ignore un message mal formé au lieu de faire planter l'app", () => {
    expect(parseStreamData('{ pas du json')).toBeNull()
  })
})
