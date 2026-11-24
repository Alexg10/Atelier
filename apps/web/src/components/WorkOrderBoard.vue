<script setup lang="ts">
import { computed, ref } from 'vue'
import { canTransition, workOrderStatuses, type WorkOrderStatus, type WorkOrderSummary } from '@atelier/shared'
import { workOrderPriorityLabels, workOrderStatusLabels } from '../utils/workOrders'
import BaseBadge from './ui/BaseBadge.vue'

const props = defineProps<{
  workOrders: WorkOrderSummary[]
}>()

// Le tableau ne modifie rien lui-même : il signale « cet ordre doit passer dans cette colonne », le parent enregistre.
const emit = defineEmits<{
  move: [workOrder: WorkOrderSummary, status: WorkOrderStatus]
}>()

const columns = computed(() =>
  workOrderStatuses.map((status) => ({
    status,
    workOrders: props.workOrders.filter((workOrder) => workOrder.status === status),
  })),
)

// L'état du glisser-déposer : local au tableau, personne d'autre n'en a besoin.
const dragged = ref<WorkOrderSummary | null>(null)
const hoveredStatus = ref<WorkOrderStatus | null>(null)

// La règle métier vient de shared : le kanban, la liste et l'API appliquent la même.
function canDropIn(status: WorkOrderStatus) {
  return dragged.value !== null && dragged.value.status !== status && canTransition(dragged.value.status, status)
}

function onDragStart(event: DragEvent, workOrder: WorkOrderSummary) {
  dragged.value = workOrder
  event.dataTransfer?.setData('text/plain', String(workOrder.id))
}

function onDragOver(event: DragEvent, status: WorkOrderStatus) {
  if (!canDropIn(status)) return
  // Par défaut, le navigateur refuse tout dépôt : preventDefault() est la façon (contre-intuitive) de l'accepter.
  event.preventDefault()
  hoveredStatus.value = status
}

function onDrop(status: WorkOrderStatus) {
  if (dragged.value && canDropIn(status)) emit('move', dragged.value, status)
  onDragEnd()
}

function onDragEnd() {
  dragged.value = null
  hoveredStatus.value = null
}
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-3">
    <section
      v-for="column in columns"
      :key="column.status"
      class="rounded-3xl bg-stone-100 p-3 transition"
      :class="{
        'ring-2 ring-brand': hoveredStatus === column.status,
        'opacity-50': dragged && dragged.status !== column.status && !canDropIn(column.status),
      }"
      @dragover="onDragOver($event, column.status)"
      @dragleave="hoveredStatus = null"
      @drop="onDrop(column.status)"
    >
      <h2 class="flex items-center justify-between px-2 py-1 text-sm font-medium text-stone-500">
        {{ workOrderStatusLabels[column.status] }}
        <span class="text-xs text-stone-400">{{ column.workOrders.length }}</span>
      </h2>

      <!-- TransitionGroup anime chaque carte qui entre, sort ou change de place. Les classes Tailwind sont passées en props :
           pas de CSS à écrire. leave-active en absolute : la carte qui part ne bloque plus la place, les autres glissent. -->
      <TransitionGroup
        tag="ul"
        class="relative mt-2 min-h-24 space-y-2"
        enter-active-class="transition duration-300"
        enter-from-class="opacity-0 scale-95"
        leave-active-class="absolute inset-x-0 transition duration-200"
        leave-to-class="opacity-0 scale-95"
        move-class="transition-transform duration-300"
      >
        <!-- La key (l'id) permet à Vue de reconnaître la même carte d'un rendu à l'autre, et donc de l'animer. -->
        <li
          v-for="workOrder in column.workOrders"
          :key="workOrder.id"
          :draggable="workOrder.status !== 'done'"
          class="rounded-2xl bg-surface p-4 text-sm shadow-xs"
          :class="workOrder.status === 'done' ? 'text-stone-400' : 'cursor-grab active:cursor-grabbing'"
          @dragstart="onDragStart($event, workOrder)"
          @dragend="onDragEnd"
        >
          <p class="font-medium" :class="{ 'text-ink': workOrder.status !== 'done' }">{{ workOrder.title }}</p>
          <p class="mt-1 text-xs text-stone-500">{{ workOrder.machineName }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-1.5">
            <BaseBadge :tone="workOrder.priority === 'high' && workOrder.status !== 'done' ? 'brand' : 'neutral'">
              {{ workOrderPriorityLabels[workOrder.priority] }}
            </BaseBadge>
            <BaseBadge v-if="workOrder.alertId">depuis une alerte</BaseBadge>
            <span class="ml-auto text-xs text-stone-400">{{ workOrder.assignee?.name ?? 'Non assigné' }}</span>
          </div>
        </li>
      </TransitionGroup>
    </section>
  </div>
</template>
