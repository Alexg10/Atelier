<script setup lang="ts">
import { RouterLink, useLink, type RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  to: RouteLocationRaw
  label: string
}>()

// useLink est le composable sur lequel repose <RouterLink> : il expose href, navigate et l'état actif.
const { isActive } = useLink(props)
</script>

<template>
  <!-- RouterLink rend un <a href> mais intercepte le clic : la page change sans rechargement complet. -->
  <RouterLink
    :to="to"
    class="rounded-full px-4 py-2 text-sm font-medium transition"
    :class="isActive ? 'bg-ink text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-ink'"
  >
    {{ label }}
  </RouterLink>
</template>
