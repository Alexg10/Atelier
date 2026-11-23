<script setup lang="ts">
defineProps<{
  label: string
  active?: boolean
}>()
</script>

<template>
  <!-- Le @click posé par le parent sur <FilterPill> retombe automatiquement sur ce <button> racine (fallthrough). -->
  <button
    type="button"
    class="rounded-full px-3.5 py-1.5 text-sm font-medium transition"
    :class="active ? 'bg-ink text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-ink'"
    :aria-pressed="active"
  >
    {{ label }}
  </button>
</template>
