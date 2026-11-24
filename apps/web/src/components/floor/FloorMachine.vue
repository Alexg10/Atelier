<script setup lang="ts">
import { computed, ref, shallowRef, type Component } from 'vue'
import { useLoop } from '@tresjs/core'
import { Html } from '@tresjs/cientos'
import type { MachineHealth, MachineOverview, MachineType } from '@atelier/shared'
import type { MeshStandardMaterial } from 'three'
import { degreesToRadians, healthColorToken, machineSizes, PLINTH_HEIGHT, PLINTH_MARGIN } from '../../utils/floor'
import { themeColor } from '../../utils/theme'
import FloorMachineLabel from './FloorMachineLabel.vue'
import FloorCylinder from './FloorCylinder.vue'
import RoundedBlock from './RoundedBlock.vue'
import CncModel from './models/CncModel.vue'
import ConveyorModel from './models/ConveyorModel.vue'
import OvenModel from './models/OvenModel.vue'
import PressModel from './models/PressModel.vue'
import RobotModel from './models/RobotModel.vue'

const props = defineProps<{
  machine: MachineOverview
}>()

// Comme un composant HTML : la scène signale ce qui se passe, la page décide quoi en faire (naviguer, changer le curseur).
const emit = defineEmits<{
  select: [machineId: number]
  hover: [machineId: number | null]
}>()

// Un composant par type de machine : <component :is> choisit lequel afficher (l'équivalent d'un switch dans le template).
const models: Record<MachineType, Component> = {
  press: PressModel,
  cnc: CncModel,
  conveyor: ConveyorModel,
  robot: RobotModel,
  oven: OvenModel,
}

// État local : seule cette machine a besoin de savoir qu'elle est survolée (pour déplier son étiquette).
const hovered = ref(false)
function setHovered(value: boolean) {
  hovered.value = value
  emit('hover', value ? props.machine.id : null)
}

const size = computed(() => machineSizes[props.machine.type])
const plinthSize = computed(() => [size.value[0] + PLINTH_MARGIN, PLINTH_HEIGHT, size.value[2] + PLINTH_MARGIN] as const)
// Les modèles ne s'animent que si la machine produit : à l'arrêt ou en panne, tout se fige.
const running = computed(() => props.machine.lastReading?.status === 'running')

// La colonne lumineuse (comme sur une vraie machine), dans un coin du socle.
const beaconPosition = computed(() => [plinthSize.value[0] / 2 - 0.2, PLINTH_HEIGHT, -plinthSize.value[2] / 2 + 0.2] as const)

// computed : quand le flux SSE met à jour la Health dans le store, la couleur suit, et TresJS met à jour le matériau.
const healthColor = computed(() => themeColor(healthColorToken(props.machine.health)))

// ref="glowMaterial" dans le template remplit cette ref avec le vrai MeshStandardMaterial, pour le modifier à chaque image.
// shallowRef, et non useTemplateRef : ce dernier renvoie en dev une version en lecture seule, qui interdit d'écrire dans l'objet.
const glowMaterial = shallowRef<MeshStandardMaterial | null>(null)
const beaconMaterial = shallowRef<MeshStandardMaterial | null>(null)

// Intensité du liseré : discret quand tout va bien, franc en panne ; l'alerte, elle, pulse (voir plus bas).
const GLOW_INTENSITY: Record<MachineHealth, number> = { ok: 0.25, warning: 0.8, fault: 1.4 }
const PULSE_SECONDS = 1.5

// useLoop : la boucle de rendu de TresJS (≈ 60 images/s). onBeforeRender s'exécute avant chaque image.
// On écrit directement dans l'objet Three.js, sans passer par une ref réactive : 60 mises à jour par seconde
// à travers la réactivité de Vue seraient du travail inutile. Le callback est retiré au démontage du composant.
const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  const { health } = props.machine
  const wave = (1 + Math.sin((elapsed / PULSE_SECONDS) * 2 * Math.PI)) / 2
  const intensity = health === 'warning' ? 0.3 + wave * 1.4 : GLOW_INTENSITY[health]
  if (glowMaterial.value) glowMaterial.value.emissiveIntensity = intensity
  if (beaconMaterial.value) beaconMaterial.value.emissiveIntensity = intensity * 1.5
})
</script>

<template>
  <!-- Le groupe porte la position et l'orientation ; ses enfants sont placés par rapport à lui.
       Les événements de pointeur fonctionnent comme en HTML : TresJS lance un rayon depuis la souris pour savoir quoi est touché. -->
  <TresGroup
    :position="[machine.posX, 0, machine.posZ]"
    :rotation="[0, degreesToRadians(machine.rotation), 0]"
    @click="emit('select', machine.id)"
    @pointerenter="setHovered(true)"
    @pointerleave="setHovered(false)"
  >
    <!-- Le liseré de Health : une fine plaque lumineuse qui dépasse à peine du socle. C'est la seule couleur de la machine.
         emissive : la couleur que le matériau émet de lui-même, visible même dans l'ombre. -->
    <TresMesh :position="[0, 0.04, 0]" receive-shadow>
      <TresBoxGeometry :args="[plinthSize[0] + 0.12, 0.08, plinthSize[2] + 0.12]" />
      <TresMeshStandardMaterial ref="glowMaterial" :color="healthColor" :emissive="healthColor" />
    </TresMesh>

    <!-- Le socle arrondi, puis le modèle du type de machine posé dessus. -->
    <RoundedBlock :size="[...plinthSize]" :radius="0.12" />
    <TresGroup :position="[0, PLINTH_HEIGHT, 0]">
      <component :is="models[machine.type]" :running="running" />
    </TresGroup>

    <!-- La colonne lumineuse : un mât et une lampe, de la couleur de la Health. -->
    <FloorCylinder :radius="0.035" :height="0.8" :position="[...beaconPosition]" tone="metal" />
    <TresMesh :position="[beaconPosition[0], beaconPosition[1] + 0.92, beaconPosition[2]]">
      <TresCylinderGeometry :args="[0.1, 0.1, 0.24, 24]" />
      <TresMeshStandardMaterial ref="beaconMaterial" :color="healthColor" :emissive="healthColor" />
    </TresMesh>

    <!-- Html : un élément du DOM, superposé au canvas et repositionné à chaque image pour suivre ce point de la scène.
         pointer-events none : l'étiquette ne bloque pas le clic sur la machine en dessous.
         z-index-range : la carte survolée passe au-dessus des autres étiquettes. -->
    <Html
      :position="[0, PLINTH_HEIGHT + size[1] + 0.5, 0]"
      center
      pointer-events="none"
      :z-index-range="hovered ? [30, 20] : [10, 0]"
    >
      <FloorMachineLabel :machine="machine" :expanded="hovered" />
    </Html>
  </TresGroup>
</template>
