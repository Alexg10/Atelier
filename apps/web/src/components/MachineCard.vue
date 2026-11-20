<script setup lang="ts">
import type { MachineHealth, MachineOverview } from '@atelier/shared'

// Données en dur pour l'instant : la carte recevra sa machine en prop à l'étape 3.
const machine: MachineOverview = {
  id: 2,
  name: 'Presse 2',
  type: 'press',
  line: 'Ligne A',
  thresholds: { temperature: { max: 80 }, vibration: { max: 6 }, rate: { min: 20 } },
  posX: 4,
  posZ: 0,
  rotation: 0,
  lastReading: {
    timestamp: '2026-11-20T14:32:05.000Z',
    temperature: 91.4,
    vibration: 3.1,
    rate: 29.5,
    status: 'running',
  },
  openAlertCount: 1,
  health: 'warning',
}

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

type Metric = {
  key: string
  label: string
  value: number
  unit: string
  limit: string
  outOfRange: boolean
}

// On prépare les données dans le script pour garder le template simple (une boucle, pas de logique).
const reading = machine.lastReading
const { thresholds } = machine
const metrics: Metric[] = reading
  ? [
      {
        key: 'temperature',
        label: 'Température',
        value: reading.temperature,
        unit: '°C',
        limit: `max ${thresholds.temperature.max}`,
        outOfRange: reading.temperature > thresholds.temperature.max,
      },
      {
        key: 'vibration',
        label: 'Vibration',
        value: reading.vibration,
        unit: 'mm/s',
        limit: `max ${thresholds.vibration.max}`,
        outOfRange: reading.vibration > thresholds.vibration.max,
      },
      {
        key: 'rate',
        label: 'Cadence',
        value: reading.rate,
        unit: 'p/min',
        limit: `min ${thresholds.rate.min}`,
        // La cadence n'est surveillée que si la machine tourne (un arrêt n'est pas une sous-cadence).
        outOfRange: reading.status === 'running' && reading.rate < thresholds.rate.min,
      },
    ]
  : []
</script>

<template>
  <article class="w-80 rounded-3xl bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
    <header class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-ink">{{ machine.name }}</h2>
        <p class="text-sm text-stone-400">{{ machine.line }} · {{ machine.type }}</p>
      </div>
      <!-- :class (raccourci de v-bind:class) : la classe dépend d'une expression JS -->
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
        :class="healthBadgeClasses[machine.health]"
      >
        <span class="size-1.5 rounded-full" :class="healthDotClasses[machine.health]" />
        {{ healthLabels[machine.health] }}
      </span>
    </header>

    <!-- v-show garde l'élément dans le DOM et bascule display: none -->
    <p v-show="machine.openAlertCount > 0" class="mt-3 text-sm font-medium text-health-warning">
      {{ machine.openAlertCount }} alerte(s) en cours
    </p>

    <!-- <template> regroupe plusieurs éléments sous un même v-if sans ajouter de nœud au DOM (comme <></> en React) -->
    <template v-if="machine.lastReading">
      <dl class="mt-4 grid grid-cols-3 gap-2">
        <!-- v-for répète l'élément pour chaque mesure ; :key identifie chaque élément de façon stable -->
        <div v-for="metric in metrics" :key="metric.key" class="rounded-2xl bg-canvas/60 p-3">
          <dt class="text-xs text-stone-400">{{ metric.label }}</dt>
          <!-- :class accepte aussi un objet { classe: condition } -->
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
        <!-- :title lie un attribut HTML à une valeur JS (sans les « : », ce serait le texte littéral) -->
        <span :title="machine.lastReading.timestamp">
          · {{ new Date(machine.lastReading.timestamp).toLocaleTimeString('fr-FR') }}
        </span>
      </p>
    </template>
    <p v-else class="mt-4 text-xs italic text-stone-400">Aucun relevé reçu</p>
  </article>
</template>
