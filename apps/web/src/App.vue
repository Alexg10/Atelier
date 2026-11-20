<script setup lang="ts">
import { ref } from 'vue'
import MachineGrid from './components/MachineGrid.vue'
import { machineFixtures } from './fixtures/machines'

// L'état de sélection vit dans le parent, qui le possède et le modifie (ref : vu en détail à l'étape 4).
const selectedId = ref<number | null>(null)

function onSelect(machineId: number) {
  // Recliquer sur la carte sélectionnée la désélectionne.
  selectedId.value = selectedId.value === machineId ? null : machineId
}
</script>

<template>
  <main class="min-h-screen bg-canvas p-8 font-sans text-ink">
    <h1 class="text-3xl font-semibold tracking-tight">Bonjour 👋</h1>
    <p class="mt-1 text-sm text-stone-500">Suivez l'état de l'atelier, les alertes et les ordres de maintenance.</p>

    <p class="mt-6 h-5 text-sm text-stone-500">
      <template v-if="selectedId !== null">Machine sélectionnée : #{{ selectedId }}</template>
    </p>

    <section class="mt-2">
      <!-- Dans le template, on écrit les props en kebab-case (selected-id) ; Vue les fait correspondre à selectedId. -->
      <MachineGrid :machines="machineFixtures" :selected-id="selectedId" @select="onSelect" />
    </section>
  </main>
</template>
