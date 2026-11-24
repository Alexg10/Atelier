<script setup lang="ts">
import RoundedBlock from '../RoundedBlock.vue'

// Tous les modèles reçoivent running (FloorMachine le passe à chacun) ; celui-ci n'anime rien, mais le déclare :
// sinon Vue ne saurait pas où poser cet attribut, le template ayant plusieurs éléments racines.
defineProps<{ running: boolean }>()
</script>

<template>
  <!-- Un centre d'usinage : carter fermé, porte vitrée avec poignée, pupitre et écran de commande, évacuation sur le dessus. -->
  <RoundedBlock :size="[2.4, 1.8, 1.8]" :radius="0.18" />
  <RoundedBlock :size="[1.3, 0.85, 0.04]" :position="[-0.3, 0.55, 0.9]" :radius="0.02" tone="dark" />
  <RoundedBlock :size="[0.06, 0.5, 0.08]" :position="[0.42, 0.72, 0.93]" :radius="0.02" tone="metal" />
  <RoundedBlock :size="[0.45, 0.75, 0.14]" :position="[0.92, 0.6, 0.95]" :radius="0.04" tone="detail" />
  <RoundedBlock :size="[0.32, 0.22, 0.02]" :position="[0.92, 1.05, 1.02]" :radius="0.01" tone="screen" />
  <RoundedBlock :size="[1.4, 0.2, 1.1]" :position="[-0.2, 1.8, -0.1]" tone="detail" />
</template>
