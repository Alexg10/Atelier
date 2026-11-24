import { onScopeDispose, ref, shallowRef, watch, type WatchSource } from 'vue'

/**
 * Charge une donnée qui dépend d'une source réactive (id, période…) et la recharge quand cette source change.
 * La requête précédente est annulée : seule la réponse correspondant à la source actuelle est gardée.
 */
export function useAsyncData<Source, Data>(
  source: WatchSource<Source>,
  fetcher: (value: Source, signal: AbortSignal) => Promise<Data>,
) {
  // shallowRef : la donnée est remplacée d'un bloc à chaque chargement, inutile de rendre chaque objet profondément réactif.
  const data = shallowRef<Data | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let currentRequest: AbortController | null = null

  async function load(value: Source) {
    currentRequest?.abort()
    const request = new AbortController()
    currentRequest = request

    loading.value = true
    try {
      data.value = await fetcher(value, request.signal)
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

  watch(source, load, { immediate: true })

  // onScopeDispose plutôt qu'onUnmounted : appelé au démontage d'un composant ET à l'arrêt d'un effectScope (tests, stores).
  onScopeDispose(() => currentRequest?.abort())

  return { data, loading, error }
}
