<script setup lang="ts">
import { computed } from 'vue'
import type { StreamStatus } from '../api/machineStream'

const props = defineProps<{
  status: StreamStatus
}>()

const label = computed(
  () => ({ open: 'En direct', connecting: 'Reconnexion…', closed: 'Hors ligne' })[props.status],
)
</script>

<template>
  <!-- role="status" : le changement d'état est annoncé poliment par les lecteurs d'écran -->
  <span role="status" class="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-medium">
    <span class="relative flex size-2">
      <span v-if="status === 'open'" class="absolute inline-flex size-full animate-ping rounded-full bg-brand/60" />
      <span class="relative inline-flex size-2 rounded-full" :class="status === 'open' ? 'bg-brand' : 'bg-stone-300'" />
    </span>
    <span :class="status === 'open' ? 'text-ink' : 'text-stone-500'">{{ label }}</span>
  </span>
</template>
