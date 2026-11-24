<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import type { Object3D } from 'three'
import { cyclePhase } from '../../../utils/floor'
import FloorMaterial from '../FloorMaterial.vue'
import RoundedBlock from '../RoundedBlock.vue'

const props = defineProps<{ running: boolean }>()

const LENGTH = 3.6
const ROLLER_COUNT = 12
const rollers = Array.from({ length: ROLLER_COUNT }, (_, index) => -LENGTH / 2 + 0.15 + (index * (LENGTH - 0.3)) / (ROLLER_COUNT - 1))
const legs: [number, number][] = [
  [-1.5, -0.45],
  [-1.5, 0.45],
  [1.5, -0.45],
  [1.5, 0.45],
]

const CRATE_COUNT = 3
const TRAVEL_SECONDS = 6 // temps pour qu'une caisse traverse le convoyeur

// Ref fonction : Vue appelle (el) => … pour chaque caisse du v-for. Un simple tableau suffit : rien d'autre que la boucle
// de rendu ne le lit, inutile qu'il soit réactif.
const crates: Object3D[] = []
function setCrate(index: number, element: unknown) {
  if (element) crates[index] = element as Object3D
}

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  if (!props.running) return
  crates.forEach((crate, index) => {
    // Chaque caisse a son décalage : elles sont réparties sur la longueur et avancent toutes à la même vitesse.
    const phase = cyclePhase(elapsed, TRAVEL_SECONDS, index / CRATE_COUNT)
    crate.position.x = -LENGTH / 2 + phase * LENGTH
    // Elles grossissent en entrant et rétrécissent en sortant, au lieu d'apparaître d'un coup.
    const scale = Math.min(1, phase / 0.08, (1 - phase) / 0.08)
    crate.scale.setScalar(Math.max(scale, 0.001))
  })
})
</script>

<template>
  <!-- Pieds, deux longerons, une rangée de rouleaux métalliques et le moteur d'entraînement sur le côté. -->
  <RoundedBlock v-for="[x, z] in legs" :key="`${x}:${z}`" :size="[0.12, 0.55, 0.12]" :position="[x, 0, z]" tone="metal" />
  <RoundedBlock :size="[LENGTH, 0.22, 0.1]" :position="[0, 0.55, -0.55]" />
  <RoundedBlock :size="[LENGTH, 0.22, 0.1]" :position="[0, 0.55, 0.55]" />
  <!-- Un rouleau est un cylindre couché : rotation d'un quart de tour autour de l'axe X. -->
  <TresMesh v-for="x in rollers" :key="x" :position="[x, 0.7, 0]" :rotation="[Math.PI / 2, 0, 0]" cast-shadow receive-shadow>
    <TresCylinderGeometry :args="[0.06, 0.06, 1, 16]" />
    <FloorMaterial tone="metal" />
  </TresMesh>
  <RoundedBlock :size="[0.5, 0.4, 0.3]" :position="[1.3, 0.2, -0.75]" :radius="0.05" tone="detail" />

  <TresGroup v-for="index in CRATE_COUNT" :key="index" :ref="(element) => setCrate(index - 1, element)" :position="[0, 0.76, 0]">
    <RoundedBlock :size="[0.5, 0.4, 0.5]" :radius="0.04" />
    <RoundedBlock :size="[0.52, 0.05, 0.12]" :position="[0, 0.36, 0]" :radius="0.01" tone="detail" />
  </TresGroup>
</template>
