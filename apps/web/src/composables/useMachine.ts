import { onUnmounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { MachineOverview } from '@atelier/shared'
import { fetchMachine } from '../api/client'

// L'id peut être une valeur fixe, une ref ou un getter : le composable suit ses changements.
export function useMachine(id: MaybeRefOrGetter<number>) {
  const machine = ref<MachineOverview | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let currentRequest: AbortController | null = null

  async function load(machineId: number) {
    currentRequest?.abort()
    const request = new AbortController()
    currentRequest = request

    loading.value = true
    error.value = null
    try {
      machine.value = await fetchMachine(machineId, request.signal)
    } catch (cause) {
      if (request.signal.aborted) return
      machine.value = null
      error.value = cause instanceof Error ? cause.message : 'Erreur inconnue'
    } finally {
      if (currentRequest === request) {
        loading.value = false
        currentRequest = null
      }
    }
  }

  // toValue lit l'id quelle que soit sa forme ; immediate : premier chargement tout de suite, puis à chaque changement d'id.
  watch(() => toValue(id), load, { immediate: true })

  onUnmounted(() => currentRequest?.abort())

  return { machine, loading, error }
}
