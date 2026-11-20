<script setup lang="ts">
import type { MachineOverview } from '@atelier/shared'
import MachineCard from './MachineCard.vue'

defineProps<{
  machines: MachineOverview[]
  selectedId: number | null
}>()

const emit = defineEmits<{
  select: [machineId: number]
}>()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    <!-- La grille ne décide rien : elle transmet la sélection vers le bas et relaie l'event vers le haut. -->
    <MachineCard
      v-for="machine in machines"
      :key="machine.id"
      :machine="machine"
      :selected="machine.id === selectedId"
      @select="(machineId) => emit('select', machineId)"
    />
  </div>
</template>
