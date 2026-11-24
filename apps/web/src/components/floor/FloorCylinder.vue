<script setup lang="ts">
import { computed } from 'vue'
import FloorMaterial, { type FloorTone } from './FloorMaterial.vue'

// Un cylindre debout, posé par sa face du dessous, comme RoundedBlock.
const props = withDefaults(
  defineProps<{
    radius: number
    height: number
    /** Rayon du haut, s'il diffère (un cône tronqué). */
    radiusTop?: number
    position?: [x: number, y: number, z: number]
    tone?: FloorTone
  }>(),
  { position: () => [0, 0, 0], tone: 'body' },
)

const center = computed(() => [props.position[0], props.position[1] + props.height / 2, props.position[2]] as const)
</script>

<template>
  <TresMesh :position="center" cast-shadow receive-shadow>
    <!-- args : les arguments du constructeur, new CylinderGeometry(rayonHaut, rayonBas, hauteur, segments). -->
    <TresCylinderGeometry :args="[radiusTop ?? radius, radius, height, 32]" />
    <FloorMaterial :tone="tone" />
  </TresMesh>
</template>
