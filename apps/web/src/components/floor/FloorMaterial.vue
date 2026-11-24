<script setup lang="ts">
import { themeColor } from '../../utils/theme'

// Une palette volontairement réduite, comme dans un rendu « clay » : la couleur vive est réservée à la Health
// (et le bleu de la marque aux écrans, qui affichent des graphes).
export type FloorTone = 'floor' | 'body' | 'detail' | 'metal' | 'dark' | 'glass' | 'screen'

const props = withDefaults(defineProps<{ tone?: FloorTone }>(), { tone: 'body' })

// roughness : 0 = miroir, 1 = mat. metalness : 0 = plastique / peinture, 1 = métal nu.
const materials: Record<FloorTone, { color: string; roughness: number; metalness: number; opacity?: number }> = {
  floor: { color: themeColor('floor'), roughness: 0.9, metalness: 0 },
  body: { color: themeColor('machine'), roughness: 0.55, metalness: 0 },
  detail: { color: themeColor('machine-detail'), roughness: 0.6, metalness: 0 },
  metal: { color: themeColor('machine-detail'), roughness: 0.3, metalness: 0.6 },
  dark: { color: themeColor('machine-dark'), roughness: 0.25, metalness: 0.2 },
  glass: { color: '#ffffff', roughness: 0.05, metalness: 0, opacity: 0.18 },
  screen: { color: themeColor('machine-dark'), roughness: 0.2, metalness: 0 },
}
const material = materials[props.tone]
const brand = themeColor('brand')
</script>

<template>
  <!-- Placé dans un <TresMesh>, ce matériau devient automatiquement le material du mesh (TresJS le rattache selon son type). -->
  <TresMeshStandardMaterial
    :color="material.color"
    :roughness="material.roughness"
    :metalness="material.metalness"
    :transparent="material.opacity !== undefined"
    :opacity="material.opacity ?? 1"
    :emissive="tone === 'screen' ? brand : '#000000'"
    :emissive-intensity="tone === 'screen' ? 0.55 : 0"
  />
</template>
