import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AlertSummary } from '@atelier/shared'
import { fetchOpenAlerts } from '../api/client'

// Les alertes en cours de tout l'atelier. Ce store ne sait rien du flux SSE : il expose des actions, et c'est le store live qui les appelle.
export const useAlertsStore = defineStore('alerts', () => {
  const openAlerts = ref<AlertSummary[]>([])
  const error = ref<string | null>(null)

  const openCount = computed(() => openAlerts.value.length)

  async function load() {
    try {
      openAlerts.value = await fetchOpenAlerts()
      error.value = null
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Erreur inconnue'
    }
  }

  function applyOpened(alert: AlertSummary) {
    // Garde-fou : après une reconnexion, l'alerte peut déjà être là (rechargée par load).
    if (openAlerts.value.some((existing) => existing.id === alert.id)) return
    // unshift : la plus récente en premier, comme le renvoie l'API.
    openAlerts.value.unshift(alert)
  }

  function applyCleared(alert: AlertSummary) {
    openAlerts.value = openAlerts.value.filter((existing) => existing.id !== alert.id)
  }

  return { openAlerts, error, openCount, load, applyOpened, applyCleared }
})
