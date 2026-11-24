<script setup lang="ts">
import FloorCylinder from '../FloorCylinder.vue'
import RoundedBlock from '../RoundedBlock.vue'

// Tous les modèles reçoivent running (FloorMachine le passe à chacun) ; celui-ci n'anime rien, mais le déclare :
// sinon Vue ne saurait pas où poser cet attribut, le template ayant plusieurs éléments racines.
defineProps<{ running: boolean }>()
</script>

<template>
  <!-- Un four : caisson isolé, porte sombre et sa poignée, pupitre avec écran, hotte d'extraction et cheminée. -->
  <RoundedBlock :size="[3, 1.5, 2]" :radius="0.22" />
  <RoundedBlock :size="[1.6, 0.9, 0.05]" :position="[-0.3, 0.3, 1]" :radius="0.02" tone="dark" />
  <RoundedBlock :size="[1.2, 0.06, 0.1]" :position="[-0.3, 1.27, 1.05]" :radius="0.02" tone="metal" />
  <RoundedBlock :size="[0.5, 0.55, 0.1]" :position="[1.05, 0.6, 1.02]" :radius="0.04" tone="detail" />
  <RoundedBlock :size="[0.34, 0.2, 0.02]" :position="[1.05, 0.88, 1.08]" :radius="0.01" tone="screen" />
  <RoundedBlock :size="[1.2, 0.22, 1]" :position="[-0.6, 1.5, -0.3]" tone="detail" />
  <FloorCylinder :radius="0.18" :height="0.7" :position="[0.9, 1.5, -0.4]" tone="metal" />
</template>
