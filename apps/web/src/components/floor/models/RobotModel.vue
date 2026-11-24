<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import FloorCylinder from '../FloorCylinder.vue'
import FloorMaterial from '../FloorMaterial.vue'
import RoundedBlock from '../RoundedBlock.vue'

const props = defineProps<{ running: boolean }>()

// Trois articulations, chacune un groupe qui pivote autour de son origine. Les enfants suivent le mouvement du parent :
// tourner la base emporte tout le bras, plier l'épaule emporte le coude et la pince.
const base = shallowRef<Group | null>(null)
const shoulder = shallowRef<Group | null>(null)
const elbow = shallowRef<Group | null>(null)

const SHOULDER_ANGLE = -0.4
const ELBOW_ANGLE = 1.3

const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  if (!props.running || !base.value || !shoulder.value || !elbow.value) return
  base.value.rotation.y = Math.sin(elapsed * 0.6) * 1.2
  shoulder.value.rotation.z = SHOULDER_ANGLE + Math.sin(elapsed * 1.2) * 0.18
  elbow.value.rotation.z = ELBOW_ANGLE + Math.sin(elapsed * 1.2 + 1) * 0.3
})
</script>

<template>
  <FloorCylinder :radius="0.65" :height="0.25" tone="metal" />
  <TresGroup ref="base" :position="[0, 0.25, 0]">
    <FloorCylinder :radius="0.42" :radius-top="0.36" :height="0.45" />

    <TresGroup ref="shoulder" :position="[0, 0.45, 0]" :rotation="[0, 0, SHOULDER_ANGLE]">
      <!-- L'axe de l'épaule : un cylindre couché (quart de tour autour de X). -->
      <TresMesh :rotation="[Math.PI / 2, 0, 0]" cast-shadow>
        <TresCylinderGeometry :args="[0.2, 0.2, 0.5, 24]" />
        <FloorMaterial tone="dark" />
      </TresMesh>
      <RoundedBlock :size="[0.3, 1.1, 0.3]" />

      <TresGroup ref="elbow" :position="[0, 1.1, 0]" :rotation="[0, 0, ELBOW_ANGLE]">
        <TresMesh :rotation="[Math.PI / 2, 0, 0]" cast-shadow>
          <TresCylinderGeometry :args="[0.15, 0.15, 0.4, 24]" />
          <FloorMaterial tone="dark" />
        </TresMesh>
        <RoundedBlock :size="[0.24, 0.85, 0.24]" />
        <FloorCylinder :radius="0.12" :height="0.15" :position="[0, 0.85, 0]" tone="dark" />
        <RoundedBlock :size="[0.06, 0.22, 0.12]" :position="[-0.08, 1, 0]" :radius="0.02" tone="metal" />
        <RoundedBlock :size="[0.06, 0.22, 0.12]" :position="[0.08, 1, 0]" :radius="0.02" tone="metal" />
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
