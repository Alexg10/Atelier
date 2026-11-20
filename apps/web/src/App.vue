<script setup lang="ts">
// Un composant importé dans <script setup> est utilisable tel quel dans le template, sans déclaration.
import MachineCard from './components/MachineCard.vue'
</script>

<template>
  <main class="min-h-screen bg-canvas p-8 font-sans text-ink">
    <h1 class="text-3xl font-semibold tracking-tight">Bonjour 👋</h1>
    <p class="mt-1 text-sm text-stone-500">Suivez l'état de l'atelier, les alertes et les ordres de maintenance.</p>

    <div class="mt-8">
      <MachineCard />
    </div>
  </main>
</template>
