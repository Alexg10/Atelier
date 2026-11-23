import { onMounted, onUnmounted, ref } from 'vue'
import type { MachineOverview } from '@atelier/shared'
import { fetchMachines } from '../api/client'
import { useMachineStream } from './useMachineStream'

type Options = {
  /** Mises à jour en direct par le flux SSE (sinon : un seul chargement). */
  live?: boolean
}

// Un composable est une fonction qui encapsule de l'état réactif + la logique qui va avec, réutilisable par n'importe quel composant.
export function useMachines({ live = false }: Options = {}) {
  const machines = ref<MachineOverview[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdatedAt = ref<Date | null>(null)

  // Pas besoin de réactivité ici : le template ne l'affiche jamais, c'est une simple variable.
  let currentRequest: AbortController | null = null

  /** silent : rafraîchissement d'arrière-plan, sans indicateur de chargement. */
  async function load({ silent }: { silent: boolean }) {
    // Une nouvelle requête annule la précédente : seule la plus récente peut écrire dans machines.
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
      // En cas d'échec, on garde les dernières machines connues : mieux vaut des données un peu vieilles qu'un écran vide.
      error.value = cause instanceof Error ? cause.message : 'Erreur inconnue'
    } finally {
      if (currentRequest === request) {
        loading.value = false
        currentRequest = null
      }
    }
  }

  const refresh = () => load({ silent: false })

  /** Une machine poussée par le flux remplace l'ancienne version, au même endroit dans la liste. */
  function applyMachineUpdate(updated: MachineOverview) {
    const index = machines.value.findIndex((machine) => machine.id === updated.id)
    if (index === -1) return
    // Mutation directe : la ref est profondément réactive, Vue détecte l'écriture à cet index (pas besoin de recréer le tableau).
    machines.value[index] = updated
    lastUpdatedAt.value = new Date()
  }

  // Un composable peut en appeler un autre : ses hooks de cycle de vie s'attachent au même composant.
  const stream = live
    ? useMachineStream({
        machine: applyMachineUpdate,
        // Après une coupure, on recharge tout en silence pour rattraper les événements manqués.
        onReconnect: () => load({ silent: true }),
      })
    : null

  // Les hooks de cycle de vie appelés dans un composable s'attachent au composant qui l'utilise.
  onMounted(refresh)

  onUnmounted(() => currentRequest?.abort())

  // On renvoie des refs (pas leurs valeurs) pour que le composant reste réactif après déstructuration.
  return { machines, loading, error, lastUpdatedAt, refresh, streamStatus: stream?.status }
}
