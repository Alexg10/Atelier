<script setup lang="ts">
import type { MachineOverview } from '@atelier/shared'
import MachineCard from './MachineCard.vue'

defineProps<{
  machines: MachineOverview[]
}>()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    <MachineCard v-for="machine in machines" :key="machine.id" :machine="machine" />
  </div>
</template>
