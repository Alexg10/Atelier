<script setup lang="ts">
import { provide, useId } from 'vue'
import { tabsKey } from './tabs'

const props = defineProps<{
  tabs: { id: string; label: string; count?: number }[]
}>()

// L'onglet actif : v-model="…" côté parent.
const active = defineModel<string>({ required: true })

const baseId = useId()

// provide : rend une valeur disponible pour TOUS les descendants, quelle que soit leur profondeur, sans props intermédiaires.
// On fournit la ref (pas sa valeur) : les panneaux restent réactifs quand l'onglet change.
provide(tabsKey, { active, baseId })

// Navigation clavier du motif « tabs » (WAI-ARIA) : flèches gauche / droite.
function onKeydown(event: KeyboardEvent) {
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (step === 0) return
  const index = props.tabs.findIndex((tab) => tab.id === active.value)
  const next = props.tabs[(index + step + props.tabs.length) % props.tabs.length]
  if (!next) return
  active.value = next.id
  document.getElementById(`${baseId}-tab-${next.id}`)?.focus()
}
</script>

<template>
  <div>
    <div role="tablist" class="inline-flex rounded-full bg-surface p-1" @keydown="onKeydown">
      <button
        v-for="tab in tabs"
        :id="`${baseId}-tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="active === tab.id"
        :aria-controls="`${baseId}-panel-${tab.id}`"
        :tabindex="active === tab.id ? 0 : -1"
        class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition"
        :class="active === tab.id ? 'bg-ink text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-ink'"
        @click="active = tab.id"
      >
        {{ tab.label }}
        <span
          v-if="tab.count"
          class="rounded-full px-1.5 text-xs"
          :class="active === tab.id ? 'bg-white/20' : 'bg-stone-100 text-stone-600'"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Les BaseTabPanel arrivent par le slot : BaseTabs ne sait pas où ils seront, d'où provide / inject. -->
    <slot />
  </div>
</template>
