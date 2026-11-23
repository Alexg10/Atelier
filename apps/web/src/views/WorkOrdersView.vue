<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { workOrderStatuses, type WorkOrderSummary } from '@atelier/shared'
import type { WorkOrderUpdateInput } from '@atelier/shared/schemas'
import { deleteWorkOrder, fetchUsers, fetchWorkOrders, updateWorkOrder } from '../api/client'
import FilterPill from '../components/FilterPill.vue'
import AssigneeSelect from '../components/AssigneeSelect.vue'
import StatusSelect from '../components/StatusSelect.vue'
import BaseBadge from '../components/ui/BaseBadge.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import DataTable from '../components/ui/DataTable.vue'
import type { Column } from '../components/ui/dataTable'
import { useAsyncData } from '../composables/useAsyncData'
import { useWorkOrderFilters } from '../composables/useWorkOrderFilters'
import { useMachinesStore } from '../stores/machines'
import { workOrderPriorityLabels, workOrderStatusLabels } from '../utils/workOrders'

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

// La structure du tableau : les cellules simples se décrivent ici (value), les riches passent par des slots.
const columns: Column<WorkOrderSummary>[] = [
  { key: 'title', label: 'Titre' },
  { key: 'machine', label: 'Machine' },
  { key: 'priority', label: 'Priorité' },
  { key: 'status', label: 'Statut' },
  { key: 'assignee', label: 'Intervenant' },
  { key: 'createdAt', label: 'Créé le', value: (workOrder) => formatDate(workOrder.createdAt) },
  { key: 'actions', label: 'Actions', hideLabel: true, align: 'right' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

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

// L'ordre en attente de confirmation : la modale est ouverte tant qu'il y en a un.
const pendingRemoval = ref<WorkOrderSummary | null>(null)
const removalOpen = computed({
  get: () => pendingRemoval.value !== null,
  set: (isOpen) => {
    if (!isOpen) pendingRemoval.value = null
  },
})

async function confirmRemoval() {
  const workOrder = pendingRemoval.value
  if (!workOrder) return
  pendingRemoval.value = null

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

  <!-- DataTable gère la structure (en-têtes, lignes, vide, chargement) ; chaque #cell-xxx décide du rendu d'une colonne.
       { row } est la ligne que DataTable passe au slot, typée WorkOrderSummary grâce au generic. -->
  <DataTable
    v-else
    class="mt-6"
    :rows="workOrders"
    :columns="columns"
    :loading="loading"
    :row-class="(workOrder) => (workOrder.status === 'done' ? 'text-stone-400' : 'text-stone-600')"
  >
    <template #cell-title="{ row }">
      <span class="font-medium" :class="{ 'text-ink': row.status !== 'done' }">{{ row.title }}</span>
      <BaseBadge v-if="row.alertId" class="ml-1.5">depuis une alerte</BaseBadge>
    </template>

    <template #cell-machine="{ row }">
      <RouterLink :to="{ name: 'machine-detail', params: { id: row.machineId } }" class="text-brand hover:underline">
        {{ row.machineName }}
      </RouterLink>
    </template>

    <template #cell-priority="{ row }">
      <span :class="{ 'font-semibold text-ink': row.priority === 'high' && row.status !== 'done' }">
        {{ workOrderPriorityLabels[row.priority] }}
      </span>
    </template>

    <!-- :model-value + @update:model-value (et non v-model) : le parent applique le changement de façon optimiste. -->
    <template #cell-status="{ row }">
      <StatusSelect :model-value="row.status" @update:model-value="(status) => onUpdate(row, { status })" />
    </template>

    <template #cell-assignee="{ row }">
      <AssigneeSelect
        :model-value="row.assignee?.id ?? null"
        :users="users ?? []"
        :disabled="row.status === 'done'"
        @update:model-value="(assigneeId) => onUpdate(row, { assigneeId })"
      />
    </template>

    <template #cell-actions="{ row }">
      <button
        v-if="row.status === 'todo'"
        type="button"
        class="text-xs font-medium text-stone-400 hover:text-ink"
        @click="pendingRemoval = row"
      >
        Supprimer
      </button>
    </template>

    <template #empty>
      {{ hasFilters ? 'Aucun ordre ne correspond à ces filtres.' : 'Aucun ordre de maintenance.' }}
    </template>
  </DataTable>

  <!-- La modale est déclarée ici (là où vivent son état et ses actions), mais son HTML est téléporté dans <body>. -->
  <BaseModal v-model:open="removalOpen" title="Supprimer cet ordre ?">
    « {{ pendingRemoval?.title }} » sera définitivement supprimé. Seuls les ordres pas encore commencés peuvent l'être.

    <!-- #footer="{ close }" : on remplit le slot nommé et on reçoit la fonction close que la modale expose. -->
    <template #footer="{ close }">
      <button
        type="button"
        class="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-ink transition hover:bg-stone-50"
        @click="close"
      >
        Annuler
      </button>
      <button
        type="button"
        class="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85"
        @click="confirmRemoval"
      >
        Supprimer
      </button>
    </template>
  </BaseModal>
</template>
