<script setup lang="ts">
import type { MachineHealth } from '@atelier/shared'
import BaseBadge from './ui/BaseBadge.vue'

defineProps<{
  health: MachineHealth
}>()

const labels: Record<MachineHealth, string> = {
  ok: 'OK',
  warning: 'Alerte',
  fault: 'Panne',
}
</script>

<template>
  <!-- Les valeurs de Health portent le même nom que les tons du badge : la couleur suit la Health, et rien d'autre. -->
  <BaseBadge :tone="health" dot>{{ labels[health] }}</BaseBadge>
</template>
