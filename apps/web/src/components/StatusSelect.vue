<script setup lang="ts">
import { canTransition, workOrderStatuses, type WorkOrderStatus } from '@atelier/shared'
import { workOrderStatusLabels } from '../utils/workOrders'

// Le statut actuel : sert à griser les transitions interdites. Un ordre terminé est figé.
const status = defineModel<WorkOrderStatus>({ required: true })
</script>

<template>
  <select
    v-model="status"
    :disabled="status === 'done'"
    aria-label="Statut"
    class="rounded-full border-0 bg-canvas px-3 py-1 text-xs font-medium text-ink disabled:bg-transparent disabled:text-stone-400"
  >
    <!-- La règle partagée grise les transitions interdites (ex. Terminé → À faire). -->
    <option v-for="option in workOrderStatuses" :key="option" :value="option" :disabled="!canTransition(status, option)">
      {{ workOrderStatusLabels[option] }}
    </option>
  </select>
</template>
