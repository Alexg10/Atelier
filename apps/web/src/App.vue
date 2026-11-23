<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavLink from './components/NavLink.vue'
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

      <span class="grid size-9 place-items-center rounded-full bg-surface text-xs font-semibold text-stone-500">CM</span>
    </header>

    <main class="p-8">
      <!-- RouterView affiche le composant de la route courante (équivalent de <Outlet /> en React Router). -->
      <RouterView />
    </main>
  </div>
</template>
