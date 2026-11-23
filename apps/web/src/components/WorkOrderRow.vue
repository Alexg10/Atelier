<script setup lang="ts">
import { computed } from 'vue'
import { canTransition, workOrderStatuses, type UserSummary, type WorkOrderStatus, type WorkOrderSummary } from '@atelier/shared'
// import type : seul le type est utilisé, Zod n'est pas embarqué dans ce chunk.
import type { WorkOrderUpdateInput } from '@atelier/shared/schemas'
import { workOrderPriorityLabels, workOrderStatusLabels } from '../utils/workOrders'

// La ligne ne modifie rien elle-même : elle affiche l'ordre reçu et émet des demandes de changement.
const props = defineProps<{
  workOrder: WorkOrderSummary
  users: UserSummary[]
}>()

const emit = defineEmits<{
  update: [changes: WorkOrderUpdateInput]
  remove: []
}>()

function onStatusChange(event: Event) {
  emit('update', { status: (event.target as HTMLSelectElement).value as WorkOrderStatus })
}

function onAssigneeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  emit('update', { assigneeId: value ? Number(value) : null })
}

// Un ordre terminé est figé : ses champs sont désactivés.
const isDone = computed(() => props.workOrder.status === 'done')

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <tr :class="{ 'text-stone-400': isDone }">
    <td class="px-4 py-3 font-medium" :class="isDone ? 'text-stone-400' : 'text-ink'">
      {{ workOrder.title }}
      <span v-if="workOrder.alertId" class="ml-1.5 text-xs font-normal text-stone-400">depuis une alerte</span>
    </td>
    <td class="px-4 py-3">
      <RouterLink :to="{ name: 'machine-detail', params: { id: workOrder.machineId } }" class="text-brand hover:underline">
        {{ workOrder.machineName }}
      </RouterLink>
    </td>
    <td class="px-4 py-3" :class="workOrder.priority === 'high' && !isDone ? 'font-semibold text-ink' : 'text-stone-500'">
      {{ workOrderPriorityLabels[workOrder.priority] }}
    </td>
    <td class="px-4 py-3">
      <!-- :value + @change (et non v-model) : la valeur affichée vient toujours de la prop, le parent décide de la changer. -->
      <select
        :value="workOrder.status"
        :disabled="isDone"
        aria-label="Statut"
        class="rounded-full border-0 bg-canvas px-3 py-1 text-xs font-medium text-ink disabled:bg-transparent disabled:text-stone-400"
        @change="onStatusChange"
      >
        <!-- La règle partagée grise les transitions interdites (ex. Terminé → À faire). -->
        <option
          v-for="option in workOrderStatuses"
          :key="option"
          :value="option"
          :disabled="!canTransition(workOrder.status, option)"
        >
          {{ workOrderStatusLabels[option] }}
        </option>
      </select>
    </td>
    <td class="px-4 py-3">
      <select
        :value="workOrder.assignee ? String(workOrder.assignee.id) : ''"
        :disabled="isDone"
        aria-label="Intervenant"
        class="rounded-full border-0 bg-canvas px-3 py-1 text-xs font-medium text-ink disabled:bg-transparent disabled:text-stone-400"
        @change="onAssigneeChange"
      >
        <option value="">—</option>
        <option v-for="user in users" :key="user.id" :value="String(user.id)">{{ user.name }}</option>
      </select>
    </td>
    <td class="px-4 py-3 text-stone-500">{{ formatDate(workOrder.createdAt) }}</td>
    <td class="px-4 py-3 text-right">
      <button
        v-if="workOrder.status === 'todo'"
        type="button"
        class="text-xs font-medium text-stone-400 hover:text-ink"
        @click="emit('remove')"
      >
        Supprimer
      </button>
    </td>
  </tr>
</template>
