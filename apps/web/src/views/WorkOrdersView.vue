<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { workOrderStatuses, type WorkOrderSummary } from '@atelier/shared'
import type { WorkOrderUpdateInput } from '@atelier/shared/schemas'
import { deleteWorkOrder, fetchUsers, fetchWorkOrders, updateWorkOrder } from '../api/client'
import FilterPill from '../components/FilterPill.vue'
import WorkOrderRow from '../components/WorkOrderRow.vue'
import { useAsyncData } from '../composables/useAsyncData'
import { useWorkOrderFilters } from '../composables/useWorkOrderFilters'
import { useMachinesStore } from '../stores/machines'
import { workOrderStatusLabels } from '../utils/workOrders'

const { status, machine, assignee, apiFilters, hasFilters, clearFilters } = useWorkOrderFilters()

// La source est le computed des filtres : chaque changement d'URL recharge la liste (et annule la requête précédente).
const { data: workOrders, loading, error } = useAsyncData(apiFilters, (filters, signal) => fetchWorkOrders(filters, signal))

// Source constante : chargé une seule fois.
const { data: users } = useAsyncData(
  () => null,
  (_, signal) => fetchUsers(signal),
)

const { machines } = storeToRefs(useMachinesStore())

const actionError = ref<string | null>(null)

/** workOrders est un shallowRef : on remplace le tableau (map / filter) au lieu de le muter, sinon rien ne se redessine. */
function replaceWorkOrder(id: number, next: (workOrder: WorkOrderSummary) => WorkOrderSummary) {
  workOrders.value = (workOrders.value ?? []).map((workOrder) => (workOrder.id === id ? next(workOrder) : workOrder))
}

// Mise à jour optimiste : la ligne change tout de suite, puis on la remplace par la version du serveur,
// ou on revient à l'état d'avant si l'API refuse.
async function onUpdate(workOrder: WorkOrderSummary, changes: WorkOrderUpdateInput) {
  actionError.value = null
  const previous = workOrder
  const { assigneeId, ...rest } = changes
  replaceWorkOrder(workOrder.id, (current) => ({
    ...current,
    ...rest,
    assignee:
      assigneeId === undefined ? current.assignee : (users.value?.find((user) => user.id === assigneeId) ?? null),
  }))

  try {
    const saved = await updateWorkOrder(workOrder.id, changes)
    replaceWorkOrder(workOrder.id, () => saved)
  } catch (cause) {
    replaceWorkOrder(workOrder.id, () => previous)
    actionError.value = cause instanceof Error ? cause.message : 'Modification impossible'
  }
}

async function onRemove(workOrder: WorkOrderSummary) {
  // Confirmation native en attendant la modale de l'étape 11.
  if (!window.confirm(`Supprimer « ${workOrder.title} » ?`)) return
  actionError.value = null
  const previous = workOrders.value
  workOrders.value = (workOrders.value ?? []).filter((item) => item.id !== workOrder.id)
  try {
    await deleteWorkOrder(workOrder.id)
  } catch (cause) {
    workOrders.value = previous
    actionError.value = cause instanceof Error ? cause.message : 'Suppression impossible'
  }
}
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight">Ordres de maintenance</h1>
      <p class="mt-1 text-sm text-stone-500">Le travail de maintenance de l'atelier, préventif ou né d'une alerte.</p>
    </div>
    <!-- Si on filtre sur une machine, le formulaire la propose déjà. -->
    <RouterLink
      :to="{ name: 'work-order-new', query: apiFilters.machineId ? { machine: apiFilters.machineId } : {} }"
      class="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85"
    >
      Nouvel ordre
    </RouterLink>
  </div>

  <div class="mt-8 flex flex-wrap items-center gap-3">
    <div class="flex rounded-full bg-surface p-1">
      <!-- status est un computed relié à l'URL : l'affecter met à jour ?status=… -->
      <FilterPill label="Tous" :active="status === ''" @click="status = ''" />
      <FilterPill
        v-for="option in workOrderStatuses"
        :key="option"
        :label="workOrderStatusLabels[option]"
        :active="status === option"
        @click="status = option"
      />
    </div>

    <!-- v-model sur un computed en écriture : lire = lire l'URL, choisir = changer l'URL. -->
    <select
      v-model="machine"
      aria-label="Filtrer par machine"
      class="rounded-full border-0 bg-surface px-4 py-2 text-sm font-medium text-ink focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <option value="">Toutes les machines</option>
      <option v-for="option in machines" :key="option.id" :value="String(option.id)">{{ option.name }}</option>
    </select>

    <select
      v-model="assignee"
      aria-label="Filtrer par intervenant"
      class="rounded-full border-0 bg-surface px-4 py-2 text-sm font-medium text-ink focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <option value="">Tous les intervenants</option>
      <option v-for="user in users ?? []" :key="user.id" :value="String(user.id)">{{ user.name }}</option>
    </select>

    <button v-if="hasFilters" type="button" class="text-sm font-medium text-brand hover:underline" @click="clearFilters">
      Effacer les filtres
    </button>
  </div>

  <p v-if="actionError" role="alert" class="mt-6 rounded-3xl bg-surface p-4 text-sm font-medium text-ink">
    {{ actionError }}
  </p>

  <div v-if="error" role="alert" class="mt-6 rounded-3xl bg-surface p-5 text-sm">
    <p class="font-medium text-ink">Liste indisponible</p>
    <p class="mt-0.5 text-stone-500">{{ error }}</p>
  </div>

  <section v-else class="mt-6 overflow-x-auto rounded-3xl bg-surface p-2 transition-opacity" :class="{ 'opacity-50': loading }">
    <table class="w-full text-left text-sm">
      <thead class="text-xs text-stone-400">
        <tr>
          <th class="px-4 py-3 font-medium">Titre</th>
          <th class="px-4 py-3 font-medium">Machine</th>
          <th class="px-4 py-3 font-medium">Priorité</th>
          <th class="px-4 py-3 font-medium">Statut</th>
          <th class="px-4 py-3 font-medium">Intervenant</th>
          <th class="px-4 py-3 font-medium">Créé le</th>
          <th class="px-4 py-3"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-100">
        <!-- Le parent possède les données : chaque ligne émet update / remove, le parent appelle l'API. -->
        <WorkOrderRow
          v-for="workOrder in workOrders ?? []"
          :key="workOrder.id"
          :work-order="workOrder"
          :users="users ?? []"
          @update="(changes) => onUpdate(workOrder, changes)"
          @remove="onRemove(workOrder)"
        />
      </tbody>
    </table>

    <p v-if="workOrders && workOrders.length === 0" class="px-4 py-8 text-center text-sm text-stone-400">
      {{ hasFilters ? 'Aucun ordre ne correspond à ces filtres.' : 'Aucun ordre de maintenance.' }}
    </p>
    <div v-else-if="!workOrders" class="h-40 animate-pulse rounded-2xl bg-canvas" aria-hidden="true" />
  </section>
</template>
