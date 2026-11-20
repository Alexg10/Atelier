<script setup lang="ts">
import type { MachineHealth, MachineOverview } from '@atelier/shared'
import { buildMetrics } from '../utils/metrics'

// defineProps déclare ce que le parent doit fournir ; le type TS sert à la fois de contrat et de validation.
const props = defineProps<{
  machine: MachineOverview
  selected?: boolean // prop booléenne optionnelle : absente = false
}>()

// defineEmits déclare les events que la carte peut émettre vers son parent, avec le type de leur payload.
const emit = defineEmits<{
  select: [machineId: number]
}>()

const healthLabels: Record<MachineHealth, string> = {
  ok: 'OK',
  warning: 'Alerte',
  fault: 'Panne',
}

// La couleur est réservée à la Health : pastille douce + point plein, comme les statuts de la maquette.
const healthBadgeClasses: Record<MachineHealth, string> = {
  ok: 'bg-health-ok-soft text-health-ok',
  warning: 'bg-health-warning-soft text-health-warning',
  fault: 'bg-health-fault-soft text-health-fault',
}
const healthDotClasses: Record<MachineHealth, string> = {
  ok: 'bg-health-ok',
  warning: 'bg-health-warning',
  fault: 'bg-health-fault',
}
</script>

<template>
  <!-- @click (raccourci de v-on:click) écoute un event DOM ; .enter est un modificateur : seule la touche Entrée déclenche -->
  <article
    role="button"
    tabindex="0"
    class="cursor-pointer rounded-3xl bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/40"
    :class="{ 'ring-2 ring-brand': selected }"
    :aria-pressed="selected"
    @click="emit('select', machine.id)"
    @keydown.enter="emit('select', machine.id)"
  >
    <header class="flex items-start justify-between gap-3">
      <div>
        <!-- Dans le template, les props sont accessibles directement : machine plutôt que props.machine -->
        <h2 class="text-lg font-semibold text-ink">{{ machine.name }}</h2>
        <p class="text-sm text-stone-400">{{ machine.line }} · {{ machine.type }}</p>
      </div>
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
        :class="healthBadgeClasses[machine.health]"
      >
        <span class="size-1.5 rounded-full" :class="healthDotClasses[machine.health]" />
        {{ healthLabels[machine.health] }}
      </span>
    </header>

    <p v-show="machine.openAlertCount > 0" class="mt-3 text-sm font-medium text-health-warning">
      {{ machine.openAlertCount }} alerte(s) en cours
    </p>

    <template v-if="machine.lastReading">
      <dl class="mt-4 grid grid-cols-3 gap-2">
        <!-- Appelée dans le template, la fonction est réévaluée à chaque rendu : elle suit la prop. -->
        <div v-for="metric in buildMetrics(props.machine)" :key="metric.key" class="rounded-2xl bg-canvas/60 p-3">
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

      <p class="mt-4 text-xs text-stone-400">
        Statut : <span class="text-stone-600">{{ machine.lastReading.status }}</span>
        <span :title="machine.lastReading.timestamp">
          · {{ new Date(machine.lastReading.timestamp).toLocaleTimeString('fr-FR') }}
        </span>
      </p>
    </template>
    <p v-else class="mt-4 text-xs italic text-stone-400">Aucun relevé reçu</p>
  </article>
</template>
