<script setup lang="ts">
import { computed } from 'vue'
import { useTres } from '@tresjs/core'

// Hauteur de scène visible, en mètres : c'est le « zoom » d'une caméra orthographique.
const VIEW_HEIGHT = 21

// useTres ne marche qu'à l'intérieur d'un TresCanvas : il lit le contexte que le canvas fournit (provide / inject).
const { sizes } = useTres()

// Une caméra orthographique n'a pas de perspective : on lui donne une « boîte » de vue, qui doit suivre les proportions
// du canvas (TresJS ne le fait que pour les caméras perspective). Recalculée à chaque redimensionnement.
const halfHeight = VIEW_HEIGHT / 2
const halfWidth = computed(() => halfHeight * sizes.aspectRatio.value)
</script>

<template>
  <!-- Placée à égale distance sur les trois axes, la caméra regarde l'origine en diagonale : c'est la vue isométrique. -->
  <TresOrthographicCamera
    :position="[20, 20, 20]"
    :look-at="[0, 0, 0]"
    :left="-halfWidth"
    :right="halfWidth"
    :top="halfHeight"
    :bottom="-halfHeight"
    :near="0.1"
    :far="200"
  />
</template>
