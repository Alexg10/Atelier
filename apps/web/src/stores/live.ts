import { ref } from 'vue'
import { defineStore } from 'pinia'
import { openMachineStream, type StreamStatus } from '../api/machineStream'
import { useAlertsStore } from './alerts'
import { useMachinesStore } from './machines'

// La connexion temps réel de l'app : une seule, qui distribue chaque événement au store concerné.
export const useLiveStore = defineStore('live', () => {
  // Un store peut en utiliser d'autres : il suffit d'appeler leur hook dans le setup.
  const machinesStore = useMachinesStore()
  const alertsStore = useAlertsStore()

  const status = ref<StreamStatus>('connecting')
  let stream: ReturnType<typeof openMachineStream> | null = null

  function loadAll({ silent = false }: { silent?: boolean } = {}) {
    machinesStore.load({ silent })
    alertsStore.load()
  }

  /** Premier chargement + une seule connexion SSE pour toute l'app. Appeler deux fois ne fait rien de plus. */
  function start() {
    if (stream) return
    loadAll()
    stream = openMachineStream({
      machine: machinesStore.applyMachineUpdate,
      'alert-opened': alertsStore.applyOpened,
      'alert-cleared': alertsStore.applyCleared,
      onStatusChange: (next) => (status.value = next),
      // Après une coupure, on recharge tout en silence pour rattraper les événements manqués.
      onReconnect: () => loadAll({ silent: true }),
    })
  }

  function stop() {
    stream?.close()
    stream = null
  }

  return { status, start, stop }
})
