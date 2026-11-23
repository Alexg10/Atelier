<script setup lang="ts">
import type { MachineOverview } from '@atelier/shared'
import HealthBadge from './HealthBadge.vue'
import MachineMetrics from './MachineMetrics.vue'

defineProps<{
  machine: MachineOverview
}>()
</script>

<template>
  <!-- La carte est un vrai lien : clic du milieu, « ouvrir dans un nouvel onglet » et lecteurs d'écran fonctionnent. -->
  <RouterLink
    :to="{ name: 'machine-detail', params: { id: machine.id } }"
    class="block rounded-3xl bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/40"
  >
    <header class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-ink">{{ machine.name }}</h2>
        <p class="text-sm text-stone-400">{{ machine.line }} · {{ machine.type }}</p>
      </div>
      <HealthBadge :health="machine.health" />
    </header>

    <p v-show="machine.openAlertCount > 0" class="mt-3 text-sm font-medium text-health-warning">
      {{ machine.openAlertCount }} alerte(s) en cours
    </p>

    <template v-if="machine.lastReading">
      <MachineMetrics :machine="machine" class="mt-4" />
      <p class="mt-4 text-xs text-stone-400">
        Statut : <span class="text-stone-600">{{ machine.lastReading.status }}</span>
        <span :title="machine.lastReading.timestamp">
          · {{ new Date(machine.lastReading.timestamp).toLocaleTimeString('fr-FR') }}
        </span>
      </p>
    </template>
    <p v-else class="mt-4 text-xs italic text-stone-400">Aucun relevé reçu</p>
  </RouterLink>
</template>
