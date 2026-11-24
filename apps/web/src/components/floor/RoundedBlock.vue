<script setup lang="ts">
import { computed } from 'vue'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import FloorMaterial, { type FloorTone } from './FloorMaterial.vue'

// La brique de base du style : un pavé aux arêtes arrondies, posé par sa face du dessous.
const props = withDefaults(
  defineProps<{
    size: [width: number, height: number, depth: number]
    /** Centre de la face du dessous (plus simple pour empiler que le centre du volume). */
    position?: [x: number, y: number, z: number]
    radius?: number
    tone?: FloorTone
  }>(),
  { position: () => [0, 0, 0], radius: 0.08, tone: 'body' },
)

// Une géométrie Three.js créée en JS et passée en prop : utile pour les classes que TresJS n'expose pas en balise.
// computed : elle n'est recréée que si la taille ou l'arrondi changent.
const geometry = computed(() => {
  const [width, height, depth] = props.size
  const radius = Math.min(props.radius, width / 2, height / 2, depth / 2)
  return new RoundedBoxGeometry(width, height, depth, 3, radius)
})

const center = computed(() => [props.position[0], props.position[1] + props.size[1] / 2, props.position[2]] as const)
</script>

<template>
  <!-- cast-shadow / receive-shadow : l'objet projette une ombre et en reçoit. Le verre n'en projette pas. -->
  <TresMesh :geometry="geometry" :position="center" :cast-shadow="tone !== 'glass'" receive-shadow>
    <FloorMaterial :tone="tone" />
  </TresMesh>
</template>
