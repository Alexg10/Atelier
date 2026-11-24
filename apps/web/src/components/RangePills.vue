<script setup lang="ts">
import { readingRanges, type ReadingRange } from '@atelier/shared'
import FilterPill from './FilterPill.vue'

// defineModel : le parent écrit <RangePills v-model="range" />, la période choisie remonte toute seule.
const range = defineModel<ReadingRange>({ required: true })

const rangeLabels: Record<ReadingRange, string> = { '1h': '1 h', '24h': '24 h', '7d': '7 jours' }
</script>

<template>
  <div class="flex rounded-full bg-surface p-1 sm:w-fit">
    <FilterPill
      v-for="option in readingRanges"
      :key="option"
      :label="rangeLabels[option]"
      :active="range === option"
      @click="range = option"
    />
  </div>
</template>
