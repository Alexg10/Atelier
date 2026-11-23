<script setup lang="ts">
import { inject } from 'vue'
import { tabsKey } from './tabs'

defineProps<{
  id: string
}>()

// inject : récupère ce que l'ancêtre BaseTabs a fourni. Sans ancêtre, on échoue tout de suite avec un message clair.
const tabs = inject(tabsKey)
if (!tabs) throw new Error('BaseTabPanel doit être placé dans un BaseTabs')
</script>

<template>
  <!-- v-if : un panneau caché n'est pas monté (ses graphes ne sont pas créés tant qu'on ne l'ouvre pas). -->
  <div
    v-if="tabs.active.value === id"
    :id="`${tabs.baseId}-panel-${id}`"
    role="tabpanel"
    :aria-labelledby="`${tabs.baseId}-tab-${id}`"
    class="mt-4"
  >
    <slot />
  </div>
</template>
