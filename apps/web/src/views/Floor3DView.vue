<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { TresCanvas } from '@tresjs/core'
import { DirectionalLight, NeutralToneMapping, PCFShadowMap } from 'three'
import ControlRoom from '../components/floor/ControlRoom.vue'
import FloorCamera from '../components/floor/FloorCamera.vue'
import FloorMachine from '../components/floor/FloorMachine.vue'
import RoundedBlock from '../components/floor/RoundedBlock.vue'
import { useMachinesStore } from '../stores/machines'
import { CONTROL_ROOM_SIZE } from '../utils/floor'
import { themeColor } from '../utils/theme'

// Les mêmes machines que le dashboard, venues du store : la scène est pilotée par la base, rien n'est placé à la main.
const { machines } = storeToRefs(useMachinesStore())

const FLOOR_MARGIN = 3.5
const FLOOR_THICKNESS = 0.6
const PATH_WIDTH = 0.3
const CONTROL_ROOM_GAP = 6.5

// Le bureau de contrôle se place à droite de l'atelier, à mi-profondeur.
const controlRoomPosition = computed((): [number, number, number] => {
  const xs = machines.value.map((machine) => machine.posX)
  const zs = machines.value.map((machine) => machine.posZ)
  return [Math.max(...xs) + CONTROL_ROOM_GAP, 0, (Math.min(...zs) + Math.max(...zs)) / 2]
})

// L'emprise de la dalle : les machines et le bureau, plus une marge. On recentre la scène sur l'origine, que regarde la caméra.
const bounds = computed(() => {
  const [roomX, , roomZ] = controlRoomPosition.value
  const [roomWidth, roomDepth] = CONTROL_ROOM_SIZE
  const xs = [...machines.value.map((machine) => machine.posX), roomX - roomWidth / 2, roomX + roomWidth / 2]
  const zs = [...machines.value.map((machine) => machine.posZ), roomZ - roomDepth / 2, roomZ + roomDepth / 2]
  const [minX, maxX, minZ, maxZ] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
  return {
    center: [(minX + maxX) / 2, (minZ + maxZ) / 2] as const,
    size: [maxX - minX + FLOOR_MARGIN * 2, maxZ - minZ + FLOOR_MARGIN * 2] as const,
  }
})

// Les chemins entre machines d'une même Line, dans l'ordre de posX : le flux de production, dessiné au sol.
// Chaque segment est une fine plaque : sa longueur est la distance entre deux machines, son angle leur direction.
const paths = computed(() => {
  const lines = [...new Set(machines.value.map((machine) => machine.line))]
  return lines.flatMap((line) => {
    const ordered = machines.value
      .filter((machine) => machine.line === line)
      .toSorted((a, b) => a.posX - b.posX || a.posZ - b.posZ)
    return ordered.slice(1).map((to, index) => {
      const from = ordered[index]!
      const [dx, dz] = [to.posX - from.posX, to.posZ - from.posZ]
      return {
        key: `${from.id}-${to.id}`,
        position: [(from.posX + to.posX) / 2, 0, (from.posZ + to.posZ) / 2] as [number, number, number],
        length: Math.hypot(dx, dz),
        angle: -Math.atan2(dz, dx),
      }
    })
  })
})

// Le « soleil » : une lumière qui projette des ombres. Ses réglages d'ombre sont des sous-objets (shadow.camera…) :
// plus lisible en JS qu'en attributs, on le crée donc ici et on le place dans la scène avec <primitive>.
const sun = new DirectionalLight('#ffffff', 2.2)
sun.position.set(-8, 18, 12)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
// La zone couverte par les ombres : toute la dalle, sans plus (plus elle est grande, plus les ombres sont floues).
Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 })
sun.shadow.bias = -0.0004
sun.shadow.normalBias = 0.02

const background = themeColor('canvas')

// La scène 3D n'a pas de :hover CSS : on suit ce qui est sous la souris pour afficher le curseur « main ».
const hovering = ref(false)

const router = useRouter()
function openMachine(machineId: number) {
  router.push({ name: 'machine-detail', params: { id: machineId } })
}
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight">Vue 3D</h1>
      <p class="mt-1 text-sm text-stone-500">L'atelier vu de haut, tel qu'il est implanté.</p>
    </div>
  </div>

  <!-- Le canvas prend la taille de son parent : c'est ce div qui la fixe.
       relative : les étiquettes <Html> sont en position absolue, elles se repèrent sur ce conteneur. -->
  <div class="relative mt-8 h-[70vh] overflow-hidden rounded-3xl" :class="{ 'cursor-pointer': hovering }">
    <!-- v-if : on attend les machines pour calculer l'emprise (Math.min d'une liste vide donne Infinity).
         shadows + PCFShadowMap : des ombres portées, filtrées pour adoucir leurs bords.
         NeutralToneMapping : garde les blancs blancs (le réglage par défaut de TresJS les ternit un peu). -->
    <TresCanvas
      v-if="machines.length > 0"
      :clear-color="background"
      shadows
      :shadow-map-type="PCFShadowMap"
      :tone-mapping="NeutralToneMapping"
    >
      <FloorCamera />
      <!-- Un éclairage de studio : une lumière douce venue de partout (ciel / sol), plus le soleil pour les ombres. -->
      <TresHemisphereLight :intensity="1.5" sky-color="#ffffff" ground-color="#d8d6d2" />
      <primitive :object="sun" />

      <!-- Un groupe déplace tout son contenu d'un bloc : l'atelier est recentré sans toucher aux positions de la base. -->
      <TresGroup :position="[-bounds.center[0], 0, -bounds.center[1]]">
        <!-- Le sol : une dalle épaisse aux bords arrondis, comme une maquette posée sur une table. -->
        <RoundedBlock
          :size="[bounds.size[0], FLOOR_THICKNESS, bounds.size[1]]"
          :position="[bounds.center[0], -FLOOR_THICKNESS, bounds.center[1]]"
          :radius="0.3"
          tone="floor"
        />

        <!-- rotation n'est pas une prop de RoundedBlock : comme en HTML, l'attribut « retombe » sur l'élément racine (le TresMesh). -->
        <RoundedBlock
          v-for="path in paths"
          :key="path.key"
          :size="[path.length, 0.04, PATH_WIDTH]"
          :position="path.position"
          :radius="0.02"
          tone="detail"
          :rotation="[0, path.angle, 0]"
        />

        <FloorMachine
          v-for="machine in machines"
          :key="machine.id"
          :machine="machine"
          @select="openMachine"
          @hover="hovering = $event !== null"
        />

        <ControlRoom
          :position="controlRoomPosition"
          @select="router.push({ name: 'dashboard' })"
          @hover="hovering = $event"
        />
      </TresGroup>
    </TresCanvas>
  </div>
</template>
