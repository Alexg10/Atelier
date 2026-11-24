<script setup lang="ts">
import type { MachineOverview, MachineStatus } from '@atelier/shared'
import HealthBadge from '../HealthBadge.vue'
import MachineMetrics from '../MachineMetrics.vue'

// Un composant HTML ordinaire : c'est <Html> (dans FloorMachine) qui le place au-dessus de la machine en 3D.
defineProps<{
  machine: MachineOverview
  /** Survolée : l'étiquette devient une carte avec les dernières mesures. */
  expanded: boolean
}>()

const statusLabels: Record<MachineStatus, string> = { running: 'En marche', stopped: "À l'arrêt", fault: 'En panne' }
</script>

<template>
  <!-- -translate-y-1/2 : <Html center> centre l'élément sur le point 3D ; on le remonte de sa demi-hauteur pour que
       son bord bas reste au-dessus de la machine, et que la carte grandisse vers le haut sans la recouvrir. -->
  <div class="-translate-y-1/2">
    <div
      v-if="expanded"
      class="w-80 rounded-3xl bg-surface p-4 text-left shadow-lg"
    >
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-ink">{{ machine.name }}</p>
        <HealthBadge :health="machine.health" />
      </div>
      <p class="mt-0.5 text-xs text-stone-500">
        {{ machine.line }}
        <template v-if="machine.lastReading">
          · {{ statusLabels[machine.lastReading.status] }} ·
          {{ new Date(machine.lastReading.timestamp).toLocaleTimeString('fr-FR') }}
        </template>
      </p>
      <!-- Le même composant que sur la fiche machine : mêmes mesures, mêmes seuils, même mise en évidence. -->
      <MachineMetrics v-if="machine.lastReading" :machine="machine" class="mt-3" />
      <p v-else class="mt-3 text-xs text-stone-400">Aucun relevé reçu.</p>
    </div>

    <div
      v-else
      class="flex items-center gap-1.5 rounded-full bg-surface/90 py-1 pl-3 text-xs font-medium whitespace-nowrap shadow-sm"
      :class="machine.health === 'ok' ? 'pr-3' : 'pr-1'"
    >
      {{ machine.name }}
      <!-- Une machine OK n'a pas besoin de badge : l'œil ne s'arrête que sur ce qui demande une action. -->
      <HealthBadge v-if="machine.health !== 'ok'" :health="machine.health" />
    </div>
  </div>
</template>
