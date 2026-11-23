<script setup lang="ts">
import { computed } from 'vue'
import type { MachineOverview } from '@atelier/shared'
import { buildMetrics } from '../utils/metrics'

const props = defineProps<{
  machine: MachineOverview
}>()

// computed lit props.machine : quand le parent envoie une machine mise à jour, metrics se recalcule.
const metrics = computed(() => buildMetrics(props.machine))
</script>

<template>
  <dl class="grid grid-cols-3 gap-2">
    <div v-for="metric in metrics" :key="metric.key" class="rounded-2xl bg-canvas/60 p-3">
      <dt class="text-xs text-stone-400">{{ metric.label }}</dt>
      <dd class="mt-1 text-xl font-semibold" :class="{ 'text-health-warning': metric.outOfRange }">
        {{ metric.value }}
        <span class="text-xs font-normal text-stone-400">{{ metric.unit }}</span>
      </dd>
      <dd
        class="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium"
        :class="metric.outOfRange ? 'bg-health-warning-soft text-health-warning' : 'bg-surface text-stone-400'"
      >
        {{ metric.limit }}
      </dd>
    </div>
  </dl>
</template>
