import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useAsyncData } from './useAsyncData'

// Une promesse qu'on résout « à la main » : le test décide quand la réponse réseau arrive.
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// Laisse Vue et les promesses en attente faire leur travail (watch, await du fetcher…).
const flush = () => new Promise((resolve) => setTimeout(resolve))

// effectScope joue le rôle du composant : il « possède » les watch et computed du composable,
// et scope.stop() simule le démontage.
function setup<Data>(fetcher: (id: number, signal: AbortSignal) => Promise<Data>) {
  const id = ref(1)
  const scope = effectScope()
  const result = scope.run(() => useAsyncData(id, fetcher))!
  return { id, scope, ...result }
}

describe('useAsyncData', () => {
  it('charge immédiatement la donnée pour la source actuelle', async () => {
    const fetcher = vi.fn(async (id: number) => `machine ${id}`)
    const { data, loading } = setup(fetcher)

    expect(loading.value).toBe(true)
    await flush()

    expect(fetcher).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    expect(data.value).toBe('machine 1')
    expect(loading.value).toBe(false)
  })

  it('recharge quand la source change et annule la requête précédente', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const fetcher = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { id, data } = setup(fetcher)

    id.value = 2
    await nextTick()

    expect(fetcher).toHaveBeenCalledTimes(2)
    const firstSignal: AbortSignal = fetcher.mock.calls[0]![1]
    expect(firstSignal.aborted).toBe(true)

    // La réponse de la machine 2 arrive avant celle de la 1 : c'est bien la 2 qui doit rester affichée.
    second.resolve('machine 2')
    await flush()
    first.reject(new DOMException('Aborted', 'AbortError'))
    await flush()

    expect(data.value).toBe('machine 2')
  })

  it("expose le message d'erreur et arrête le chargement", async () => {
    const { error, loading } = setup(vi.fn().mockRejectedValue(new Error('API indisponible')))
    await flush()

    expect(error.value).toBe('API indisponible')
    expect(loading.value).toBe(false)
  })

  it('annule la requête en cours au démontage', async () => {
    let signal: AbortSignal | undefined
    const { scope } = setup((_id, requestSignal) => {
      signal = requestSignal
      return deferred<string>().promise
    })

    scope.stop()

    expect(signal?.aborted).toBe(true)
  })
})
