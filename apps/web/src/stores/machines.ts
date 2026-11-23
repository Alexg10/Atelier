import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { MachineOverview } from '@atelier/shared'
import { fetchMachines } from '../api/client'

// Setup store : la même syntaxe qu'un composable (ref, computed, fonctions), mais l'instance est unique et partagée par toute l'app.
// L'id 'machines' identifie le store (devtools, HMR) : il doit être unique.
export const useMachinesStore = defineStore('machines', () => {
  // Chaque ref renvoyée devient du state.
  const machines = ref<MachineOverview[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdatedAt = ref<Date | null>(null)

  let currentRequest: AbortController | null = null

  // Chaque computed renvoyé devient un getter : dérivé du state, mis en cache, partagé par tous les composants.
  const machineById = computed(() => new Map(machines.value.map((machine) => [machine.id, machine])))

  // Chaque fonction renvoyée devient une action.
  /** silent : rafraîchissement d'arrière-plan, sans indicateur de chargement. */
  async function load({ silent = false }: { silent?: boolean } = {}) {
    currentRequest?.abort()
    const request = new AbortController()
    currentRequest = request

    if (!silent) loading.value = true
    try {
      machines.value = await fetchMachines(request.signal)
      lastUpdatedAt.value = new Date()
      error.value = null
    } catch (cause) {
      if (request.signal.aborted) return
      error.value = cause instanceof Error ? cause.message : 'Erreur inconnue'
    } finally {
      if (currentRequest === request) {
        loading.value = false
        currentRequest = null
      }
    }
  }

  /** Une machine poussée par le flux remplace l'ancienne version, au même endroit dans la liste. */
  function applyMachineUpdate(updated: MachineOverview) {
    const index = machines.value.findIndex((machine) => machine.id === updated.id)
    if (index === -1) return
    machines.value[index] = updated
    lastUpdatedAt.value = new Date()
  }

  // Seul ce qui est renvoyé fait partie du store (currentRequest reste privé).
  return { machines, loading, error, lastUpdatedAt, machineById, load, applyMachineUpdate }
})
