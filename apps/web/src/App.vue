<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterView } from 'vue-router'
import LiveIndicator from './components/LiveIndicator.vue'
import NavLink from './components/NavLink.vue'
import { useAlertsStore } from './stores/alerts'
import { useLiveStore } from './stores/live'

const liveStore = useLiveStore()
const { status: streamStatus } = storeToRefs(liveStore)
const { openCount } = storeToRefs(useAlertsStore())

// App.vue vit aussi longtemps que l'application : c'est le bon endroit pour une connexion qui doit survivre à la navigation.
onMounted(liveStore.start)
onUnmounted(liveStore.stop)
</script>

<template>
  <div class="min-h-screen bg-canvas font-sans text-ink">
    <header class="flex flex-wrap items-center justify-between gap-4 px-8 pt-6">
      <RouterLink to="/" class="flex items-center gap-2.5 text-lg font-semibold">
        <span class="grid size-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">A</span>
        Atelier
      </RouterLink>

      <nav class="flex rounded-full bg-surface p-1" aria-label="Navigation principale">
        <!-- :to accepte une route nommée : si le chemin change un jour, les liens restent valides. -->
        <NavLink :to="{ name: 'dashboard' }" label="Tableau de bord" />
        <NavLink :to="{ name: 'work-orders' }" label="Ordres de maintenance" />
      </nav>

      <div class="flex items-center gap-3">
        <LiveIndicator :status="streamStatus" />
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium"
          :class="openCount > 0 ? 'text-ink' : 'text-stone-400'"
          :aria-label="`${openCount} alerte(s) en cours`"
        >
          <span aria-hidden="true">🔔</span>
          {{ openCount }}
        </span>
        <span class="grid size-9 place-items-center rounded-full bg-surface text-xs font-semibold text-stone-500">CM</span>
      </div>
    </header>

    <main class="p-8">
      <!-- RouterView affiche le composant de la route courante (équivalent de <Outlet /> en React Router). -->
      <RouterView />
    </main>
  </div>
</template>
