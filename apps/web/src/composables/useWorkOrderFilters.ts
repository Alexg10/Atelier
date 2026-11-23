import { computed } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import { workOrderStatuses, type WorkOrderStatus } from '@atelier/shared'
import type { WorkOrderFilters } from '../api/client'

// Une valeur de query peut être absente, une chaîne, null (?status) ou un tableau (?status=a&status=b) : on ne garde qu'une chaîne.
function firstValue(value: LocationQueryValue | LocationQueryValue[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value
  return first ?? ''
}

/**
 * Les filtres vivent dans l'URL (?status=todo&machine=3&assignee=2) : la page est partageable,
 * survit au rechargement et le bouton « précédent » du navigateur fonctionne.
 */
export function useWorkOrderFilters() {
  const route = useRoute()
  const router = useRouter()

  // computed avec get ET set : utilisable avec v-model. Lire = lire l'URL, écrire = changer l'URL.
  function queryParam(name: string) {
    return computed({
      get: () => firstValue(route.query[name]),
      set: (value: string) => {
        // replace (et non push) : changer un filtre ne crée pas une entrée d'historique par clic.
        // Une valeur vide retire le paramètre de l'URL au lieu de laisser « ?status= ».
        router.replace({ query: { ...route.query, [name]: value || undefined } })
      },
    })
  }

  const status = queryParam('status')
  const machine = queryParam('machine')
  const assignee = queryParam('assignee')

  // L'URL est une entrée utilisateur : on la valide avant de l'envoyer à l'API (une valeur inconnue est ignorée).
  const apiFilters = computed<WorkOrderFilters>(() => {
    const machineId = Number(machine.value)
    const assigneeId = Number(assignee.value)
    return {
      status: workOrderStatuses.includes(status.value as WorkOrderStatus) ? (status.value as WorkOrderStatus) : undefined,
      machineId: Number.isInteger(machineId) && machineId > 0 ? machineId : undefined,
      assigneeId: Number.isInteger(assigneeId) && assigneeId > 0 ? assigneeId : undefined,
    }
  })

  const hasFilters = computed(() => Object.values(apiFilters.value).some((value) => value !== undefined))

  function clearFilters() {
    router.replace({ query: {} })
  }

  return { status, machine, assignee, apiFilters, hasFilters, clearFilters }
}
