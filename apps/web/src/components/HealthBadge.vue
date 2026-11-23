<script setup lang="ts">
import type { MachineHealth } from '@atelier/shared'

defineProps<{
  health: MachineHealth
}>()

const labels: Record<MachineHealth, string> = {
  ok: 'OK',
  warning: 'Alerte',
  fault: 'Panne',
}

// La couleur est réservée à la Health : pastille douce + point plein, comme les statuts de la maquette.
const badgeClasses: Record<MachineHealth, string> = {
  ok: 'bg-health-ok-soft text-health-ok',
  warning: 'bg-health-warning-soft text-health-warning',
  fault: 'bg-health-fault-soft text-health-fault',
}
const dotClasses: Record<MachineHealth, string> = {
  ok: 'bg-health-ok',
  warning: 'bg-health-warning',
  fault: 'bg-health-fault',
}
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="badgeClasses[health]">
    <span class="size-1.5 rounded-full" :class="dotClasses[health]" />
    {{ labels[health] }}
  </span>
</template>
