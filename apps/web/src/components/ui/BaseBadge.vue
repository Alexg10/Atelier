<script setup lang="ts">
// Les tons ok / warning / fault sont réservés à la Health (voir la direction visuelle) ; les autres servent au reste.
type BadgeTone = 'neutral' | 'brand' | 'ok' | 'warning' | 'fault'

withDefaults(
  defineProps<{
    tone?: BadgeTone
    /** Petit point plein devant le texte. */
    dot?: boolean
  }>(),
  { tone: 'neutral', dot: false },
)

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-stone-100 text-stone-600',
  brand: 'bg-brand-soft text-brand',
  ok: 'bg-health-ok-soft text-health-ok',
  warning: 'bg-health-warning-soft text-health-warning',
  fault: 'bg-health-fault-soft text-health-fault',
}
const dotClasses: Record<BadgeTone, string> = {
  neutral: 'bg-stone-400',
  brand: 'bg-brand',
  ok: 'bg-health-ok',
  warning: 'bg-health-warning',
  fault: 'bg-health-fault',
}
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="toneClasses[tone]">
    <span v-if="dot" class="size-1.5 rounded-full" :class="dotClasses[tone]" />
    <slot />
  </span>
</template>
