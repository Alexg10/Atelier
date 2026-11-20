<script setup lang="ts">
// Tout ce qui est déclaré au niveau racine de <script setup> est directement utilisable dans le template.
const appName = 'Atelier'
const machineCount = 10
</script>

<template>
  <main class="min-h-screen bg-stone-50 p-8 text-stone-800">
    <!-- {{ }} : interpolation de texte, l'équivalent de {expr} en JSX -->
    <h1 class="text-3xl font-semibold">{{ appName }}</h1>
    <p class="mt-2 text-stone-500">Supervision de {{ machineCount }} machines.</p>
  </main>
</template>
