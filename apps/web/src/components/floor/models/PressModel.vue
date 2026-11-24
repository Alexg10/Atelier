<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import { cyclePhase } from '../../../utils/floor'
import FloorCylinder from '../FloorCylinder.vue'
import RoundedBlock from '../RoundedBlock.vue'

const props = defineProps<{ running: boolean }>()

// Le coulisseau descend vite (frappe) puis remonte lentement : un cycle de presse.
const STROKE_SECONDS = 2
const RAM_UP = 1.55
const RAM_DOWN = 0.7

// ref="ram" dans le template : le groupe Three.js du coulisseau, déplacé à chaque image.
const ram = shallowRef<Group | null>(null)

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  // À l'arrêt ou en panne, on ne touche plus à rien : la pièce reste figée là où elle était.
  if (!props.running || !ram.value) return
  const phase = cyclePhase(elapsed, STROKE_SECONDS)
  const down = phase < 0.2 ? phase / 0.2 : 1 - (phase - 0.2) / 0.8
  ram.value.position.y = RAM_UP - down * (RAM_UP - RAM_DOWN)
})
</script>

<template>
  <!-- Socle, table de travail en métal, deux colonnes, traverse supérieure et vérin hydraulique. -->
  <RoundedBlock :size="[2, 0.5, 1.6]" />
  <RoundedBlock :size="[1.3, 0.12, 1.1]" :position="[0, 0.5, 0]" tone="metal" />
  <RoundedBlock :size="[0.32, 1.7, 0.32]" :position="[-0.78, 0.5, 0]" />
  <RoundedBlock :size="[0.32, 1.7, 0.32]" :position="[0.78, 0.5, 0]" />
  <RoundedBlock :size="[2, 0.5, 1.6]" :position="[0, 2.2, 0]" />
  <FloorCylinder :radius="0.32" :height="0.4" :position="[0, 2.7, 0]" tone="metal" />
  <RoundedBlock :size="[0.3, 0.45, 0.12]" :position="[0.78, 1, 0.22]" :radius="0.03" tone="detail" />

  <!-- Le coulisseau et sa tige : un seul groupe, que la boucle de rendu fait monter et descendre. -->
  <TresGroup ref="ram" :position="[0, RAM_UP, 0]">
    <RoundedBlock :size="[1.1, 0.45, 0.9]" tone="dark" />
    <FloorCylinder :radius="0.09" :height="0.9" :position="[0, 0.45, 0]" tone="metal" />
  </TresGroup>
</template>
