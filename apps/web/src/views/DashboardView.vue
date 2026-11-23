<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import type { MachineHealth } from '@atelier/shared'
import FilterPill from '../components/FilterPill.vue'
import MachineGrid from '../components/MachineGrid.vue'
import MachineGridSkeleton from '../components/MachineGridSkeleton.vue'
import StatCard from '../components/StatCard.vue'
import { useMachines } from '../composables/useMachines'

// Déstructurer est sûr ici : chaque propriété renvoyée est une ref.
const { machines, loading, error, lastUpdatedAt, refresh } = useMachines({ pollInterval: 5000 })

// Premier chargement : rien à montrer encore. Lors d'une actualisation, on garde la grille affichée.
const isFirstLoad = computed(() => loading.value && machines.value.length === 0)

type Preferences = {
  line: 'all' | string
  health: 'all' | MachineHealth
  sortBy: 'name' | 'health'
}

const STORAGE_KEY = 'atelier:dashboard-preferences'
const defaultPreferences: Preferences = { line: 'all', health: 'all', sortBy: 'name' }

// Lu une seule fois, au setup, pour initialiser l'état (localStorage peut être vide, corrompu ou bloqué).
function loadPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return { ...defaultPreferences, ...saved }
  } catch {
    return defaultPreferences
  }
}
const saved = loadPreferences()

// ref : une valeur réactive unique, lue et écrite via .value dans le script.
const sortBy = ref(saved.sortBy)

// reactive : un objet réactif dont on modifie directement les propriétés (pas de .value).
const filters = reactive({
  line: saved.line,
  health: saved.health,
})

// watch : effet de bord déclenché quand une source précise change (ici : sauvegarder les préférences).
watch(
  [filters, sortBy],
  () => {
    const preferences: Preferences = { ...filters, sortBy: sortBy.value }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Stockage indisponible (navigation privée…) : on garde simplement l'état en mémoire.
    }
  },
  { deep: true },
)

const healthOptions: { value: 'all' | MachineHealth; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'ok', label: 'OK' },
  { value: 'warning', label: 'Alerte' },
  { value: 'fault', label: 'Panne' },
]

const healthSeverity: Record<MachineHealth, number> = { fault: 0, warning: 1, ok: 2 }

// computed : valeur dérivée, recalculée seulement quand filters ou sortBy changent, et mise en cache sinon.
const lines = computed(() => [...new Set(machines.value.map((machine) => machine.line))])

const visibleMachines = computed(() =>
  machines.value
    .filter((machine) => filters.line === 'all' || machine.line === filters.line)
    .filter((machine) => filters.health === 'all' || machine.health === filters.health)
    .toSorted((a, b) =>
      sortBy.value === 'health'
        ? healthSeverity[a.health] - healthSeverity[b.health] || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    ),
)

// Les compteurs portent sur tout l'atelier, pas sur la liste filtrée : ils ne bougent pas quand on filtre.
const healthCounts = computed(() => {
  const counts: Record<MachineHealth, number> = { ok: 0, warning: 0, fault: 0 }
  for (const machine of machines.value) counts[machine.health]++
  return counts
})

const runningCount = computed(() => machines.value.filter((machine) => machine.lastReading?.status === 'running').length)
const runningShare = computed(() =>
  machines.value.length === 0 ? 0 : Math.round((runningCount.value / machines.value.length) * 100),
)

// watchEffect : exécuté tout de suite, puis à chaque changement de ce qu'il lit (dépendances automatiques).
watchEffect(() => {
  const problems = healthCounts.value.warning + healthCounts.value.fault
  document.title = problems > 0 ? `(${problems}) Tableau de bord · Atelier` : 'Tableau de bord · Atelier'
})

// Cliquer sur un compteur filtre la grille sur cette Health ; recliquer retire le filtre.
function toggleHealthFilter(health: MachineHealth) {
  filters.health = filters.health === health ? 'all' : health
}
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight">Bonjour 👋</h1>
      <p class="mt-1 text-sm text-stone-500">Suivez l'état de l'atelier, les alertes et les ordres de maintenance.</p>
    </div>
    <div class="flex items-center gap-3">
      <span v-if="lastUpdatedAt" class="text-xs text-stone-400">
        Mis à jour à {{ lastUpdatedAt.toLocaleTimeString('fr-FR') }}
      </span>
      <!-- :disabled évite de lancer deux chargements en parallèle -->
      <button
        type="button"
        class="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85 disabled:opacity-50"
        :disabled="loading"
        @click="refresh"
      >
        {{ loading ? 'Actualisation…' : 'Actualiser' }}
      </button>
    </div>
  </div>

  <!-- role="alert" : le message est annoncé par les lecteurs d'écran dès qu'il apparaît -->
  <div
    v-if="error"
    role="alert"
    class="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-surface p-5 text-sm"
  >
    <div>
      <p class="font-medium text-ink">Données indisponibles</p>
      <p class="mt-0.5 text-stone-500">
        {{ error }}<template v-if="machines.length > 0"> · Les données affichées sont celles de la dernière mise à jour.</template>
      </p>
    </div>
    <button
      type="button"
      class="rounded-full border border-stone-200 px-4 py-2 font-medium text-ink transition hover:bg-stone-50"
      @click="refresh"
    >
      Réessayer
    </button>
  </div>

  <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <StatCard
      label="Machines en marche"
      :value="`${runningCount} / ${machines.length}`"
      :hint="`${runningShare} % du parc produit en ce moment`"
      highlighted
    />
    <button type="button" class="text-left" @click="toggleHealthFilter('ok')">
      <StatCard label="OK" :value="healthCounts.ok" health="ok" :active="filters.health === 'ok'" />
    </button>
    <button type="button" class="text-left" @click="toggleHealthFilter('warning')">
      <StatCard
        label="En alerte"
        :value="healthCounts.warning"
        health="warning"
        hint="Seuil franchi, la machine tourne"
        :active="filters.health === 'warning'"
      />
    </button>
    <button type="button" class="text-left" @click="toggleHealthFilter('fault')">
      <StatCard
        label="En panne"
        :value="healthCounts.fault"
        health="fault"
        hint="Production interrompue"
        :active="filters.health === 'fault'"
      />
    </button>
  </div>

  <div class="mt-8 flex flex-wrap items-center gap-3">
    <!-- Dans le template, les refs sont « déballées » : on écrit sortBy, pas sortBy.value. -->
    <div class="flex rounded-full bg-surface p-1">
      <FilterPill label="Toutes les lignes" :active="filters.line === 'all'" @click="filters.line = 'all'" />
      <FilterPill
        v-for="line in lines"
        :key="line"
        :label="line"
        :active="filters.line === line"
        @click="filters.line = line"
      />
    </div>

    <div class="flex rounded-full bg-surface p-1">
      <FilterPill
        v-for="option in healthOptions"
        :key="option.value"
        :label="option.label"
        :active="filters.health === option.value"
        @click="filters.health = option.value"
      />
    </div>

    <div class="ml-auto flex rounded-full bg-surface p-1">
      <FilterPill label="Nom" :active="sortBy === 'name'" @click="sortBy = 'name'" />
      <FilterPill label="Gravité" :active="sortBy === 'health'" @click="sortBy = 'health'" />
    </div>
  </div>

  <p class="mt-4 text-sm text-stone-500">
    {{ visibleMachines.length }} machine(s) affichée(s) sur {{ machines.length }}
  </p>

  <section class="mt-3">
    <MachineGridSkeleton v-if="isFirstLoad" />
    <MachineGrid v-else :machines="visibleMachines" />
  </section>
</template>
