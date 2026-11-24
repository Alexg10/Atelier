<script setup lang="ts">
import type { MachineOverview } from '@atelier/shared'
import HealthBadge from '../HealthBadge.vue'

// Un composant HTML ordinaire : c'est <Html> (dans FloorMachine) qui le place au-dessus de la machine en 3D.
defineProps<{
  machine: MachineOverview
}>()
</script>

<template>
  <div class="flex items-center gap-1.5 rounded-full bg-surface/90 py-1 pr-1 pl-3 text-xs font-medium whitespace-nowrap shadow-sm">
    {{ machine.name }}
    <!-- Une machine OK n'a pas besoin de badge : l'œil ne s'arrête que sur ce qui demande une action. -->
    <HealthBadge v-if="machine.health !== 'ok'" :health="machine.health" />
  </div>
</template>
