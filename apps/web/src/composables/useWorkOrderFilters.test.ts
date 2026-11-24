import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'
import { useWorkOrderFilters } from './useWorkOrderFilters'

// vi.mock remplace le module entier : useRoute / useRouter deviennent des fonctions simulées.
// Pas besoin de vrai routeur, ni d'application, ni de composant monté.
vi.mock('vue-router', () => ({ useRoute: vi.fn(), useRouter: vi.fn() }))

function setup(query: LocationQuery = {}) {
  // reactive : comme le vrai `route`, lire route.query dans un computed crée une dépendance.
  const route = reactive({ query })
  const router = { replace: vi.fn() }
  vi.mocked(useRoute).mockReturnValue(route as unknown as ReturnType<typeof useRoute>)
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>)
  return { route, router, filters: useWorkOrderFilters() }
}

describe('useWorkOrderFilters', () => {
  it("écrire un filtre met à jour l'URL en gardant les autres paramètres", () => {
    const { router, filters } = setup({ machine: '3' })

    filters.status.value = 'todo'

    expect(router.replace).toHaveBeenCalledWith({ query: { machine: '3', status: 'todo' } })
  })

  it("vider un filtre retire le paramètre de l'URL", () => {
    const { router, filters } = setup({ status: 'todo' })

    filters.status.value = ''

    expect(router.replace).toHaveBeenCalledWith({ query: { status: undefined } })
  })

  it("traduit l'URL en filtres API et ignore les valeurs invalides", () => {
    const { route, filters } = setup({ status: 'todo', machine: '3', assignee: '2' })
    expect(filters.apiFilters.value).toEqual({ status: 'todo', machineId: 3, assigneeId: 2 })

    // L'URL change (lien partagé bricolé, bouton « précédent »…) : le computed suit.
    route.query = { status: 'urgent', machine: 'abc', assignee: '-1' }
    expect(filters.apiFilters.value).toEqual({ status: undefined, machineId: undefined, assigneeId: undefined })
    expect(filters.hasFilters.value).toBe(false)
  })

  it('ne garde que la première valeur quand un paramètre est répété', () => {
    const { filters } = setup({ status: ['done', 'todo'] })

    expect(filters.status.value).toBe('done')
  })
})
