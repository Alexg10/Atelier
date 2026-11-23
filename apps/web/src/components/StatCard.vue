<script setup lang="ts">
import { computed } from 'vue'
import type { MachineHealth } from '@atelier/shared'

// withDefaults fournit des valeurs par défaut aux props optionnelles.
const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    hint?: string
    highlighted?: boolean // carte mise en avant, aux couleurs de la marque
    health?: MachineHealth // point coloré + valeur colorée si la carte compte une Health
    active?: boolean
  }>(),
  { hint: '', highlighted: false, active: false },
)

const healthDotClasses: Record<MachineHealth, string> = {
  ok: 'bg-health-ok',
  warning: 'bg-health-warning',
  fault: 'bg-health-fault',
}
const healthTextClasses: Record<MachineHealth, string> = {
  ok: 'text-health-ok',
  warning: 'text-health-warning',
  fault: 'text-health-fault',
}

// Une carte d'alerte ou de panne ne se colore que si elle compte au moins une machine.
const valueClass = computed(() =>
  props.health && props.health !== 'ok' && Number(props.value) > 0 ? healthTextClasses[props.health] : '',
)
</script>

<template>
  <div
    class="rounded-3xl p-5 transition"
    :class="[
      highlighted ? 'bg-linear-to-br from-brand to-[#6f83ff] text-white' : 'bg-surface',
      { 'ring-2 ring-ink': active },
    ]"
  >
    <p class="flex items-center gap-2 text-sm" :class="highlighted ? 'text-white/80' : 'text-stone-500'">
      <span v-if="health" class="size-2 rounded-full" :class="healthDotClasses[health]" />
      {{ label }}
    </p>
    <p class="mt-3 text-4xl font-semibold tracking-tight" :class="valueClass">
      {{ value }}
    </p>
    <p v-if="hint" class="mt-2 text-xs" :class="highlighted ? 'text-white/70' : 'text-stone-400'">{{ hint }}</p>
  </div>
</template>
