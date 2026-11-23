import { onMounted, onUnmounted, ref } from 'vue'
import type { MachineOverview } from '@atelier/shared'
import { fetchMachines } from '../api/client'

type Options = {
  /** Intervalle de rafraîchissement automatique en ms (aucun si absent). */
  pollInterval?: number
}

// Un composable est une fonction qui encapsule de l'état réactif + la logique qui va avec, réutilisable par n'importe quel composant.
export function useMachines({ pollInterval }: Options = {}) {
  const machines = ref<MachineOverview[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdatedAt = ref<Date | null>(null)

  // Pas besoin de réactivité pour ces deux-là : le template ne les affiche jamais, ce sont de simples variables.
  let currentRequest: AbortController | null = null
  let pollTimer: ReturnType<typeof setInterval> | undefined

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

  // Les hooks de cycle de vie appelés dans un composable s'attachent au composant qui l'utilise.
  onMounted(() => {
    refresh()
    if (pollInterval) pollTimer = setInterval(() => load({ silent: true }), pollInterval)
  })

  // Nettoyage : sans lui, le minuteur continuerait de tourner (et d'appeler l'API) après avoir quitté la page.
  onUnmounted(() => {
    clearInterval(pollTimer)
    currentRequest?.abort()
  })

  // On renvoie des refs (pas leurs valeurs) pour que le composant reste réactif après déstructuration.
  return { machines, loading, error, lastUpdatedAt, refresh }
}
