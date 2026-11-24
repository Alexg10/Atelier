<script setup lang="ts">
import { Html } from '@tresjs/cientos'
import { CONTROL_ROOM_SIZE } from '../../utils/floor'
import RoundedBlock from './RoundedBlock.vue'

defineProps<{
  position: [x: number, y: number, z: number]
}>()

const emit = defineEmits<{
  select: []
  hover: [hovered: boolean]
}>()

const [WIDTH, DEPTH] = CONTROL_ROOM_SIZE
const WALL = 0.14
const WALL_HEIGHT = 1.7
const desks = [-1.1, 1.1]
</script>

<template>
  <!-- Une maison de poupée : deux murs pleins au fond, deux parois vitrées devant, pas de toit pour voir l'intérieur. -->
  <TresGroup :position="position" @click="emit('select')" @pointerenter="emit('hover', true)" @pointerleave="emit('hover', false)">
    <RoundedBlock :size="[WIDTH, 0.15, DEPTH]" :radius="0.06" />
    <RoundedBlock :size="[WIDTH, WALL_HEIGHT, WALL]" :position="[0, 0.15, -DEPTH / 2 + WALL / 2]" :radius="0.04" />
    <RoundedBlock :size="[WALL, WALL_HEIGHT, DEPTH]" :position="[-WIDTH / 2 + WALL / 2, 0.15, 0]" :radius="0.04" />

    <!-- Parois vitrées : une allège pleine en bas, le verre au-dessus (transparent, il ne projette pas d'ombre). -->
    <RoundedBlock :size="[WIDTH, 0.35, 0.1]" :position="[0, 0.15, DEPTH / 2 - 0.05]" :radius="0.03" />
    <RoundedBlock :size="[WIDTH, 1.2, 0.04]" :position="[0, 0.5, DEPTH / 2 - 0.05]" :radius="0.01" tone="glass" />
    <RoundedBlock :size="[0.1, 0.35, DEPTH]" :position="[WIDTH / 2 - 0.05, 0.15, 0]" :radius="0.03" />
    <RoundedBlock :size="[0.04, 1.2, DEPTH]" :position="[WIDTH / 2 - 0.05, 0.5, 0]" :radius="0.01" tone="glass" />

    <!-- Le mur d'écrans : la supervision, en bleu de la marque comme les graphes de l'app. -->
    <RoundedBlock :size="[2.6, 0.9, 0.05]" :position="[0, 0.75, -DEPTH / 2 + WALL + 0.03]" :radius="0.02" tone="screen" />

    <!-- Deux postes : plan de travail, deux écrans et un siège chacun. -->
    <TresGroup v-for="x in desks" :key="x" :position="[x, 0.15, -0.2]">
      <RoundedBlock :size="[0.06, 0.7, 0.06]" :position="[-0.6, 0, 0]" tone="metal" />
      <RoundedBlock :size="[0.06, 0.7, 0.06]" :position="[0.6, 0, 0]" tone="metal" />
      <RoundedBlock :size="[1.5, 0.06, 0.7]" :position="[0, 0.7, 0]" :radius="0.02" />
      <RoundedBlock :size="[0.55, 0.34, 0.03]" :position="[-0.3, 0.9, -0.15]" :radius="0.01" tone="screen" />
      <RoundedBlock :size="[0.55, 0.34, 0.03]" :position="[0.3, 0.9, -0.15]" :radius="0.01" tone="screen" />
      <RoundedBlock :size="[0.05, 0.14, 0.05]" :position="[0, 0.76, -0.17]" tone="metal" />
      <RoundedBlock :size="[0.45, 0.08, 0.45]" :position="[0, 0.42, 0.65]" :radius="0.04" tone="dark" />
      <RoundedBlock :size="[0.45, 0.45, 0.07]" :position="[0, 0.5, 0.88]" :radius="0.03" tone="dark" />
      <RoundedBlock :size="[0.06, 0.42, 0.06]" :position="[0, 0, 0.65]" tone="metal" />
    </TresGroup>

    <Html :position="[0, WALL_HEIGHT + 0.7, 0]" center pointer-events="none" :z-index-range="[10, 0]">
      <div class="rounded-full bg-surface/90 px-3 py-1 text-xs font-medium whitespace-nowrap shadow-sm">Bureau de contrôle</div>
    </Html>
  </TresGroup>
</template>
