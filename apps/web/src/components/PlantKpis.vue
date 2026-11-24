<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ReadingRange } from '@atelier/shared'
import { fetchKpis } from '../api/client'
import { useAsyncData } from '../composables/useAsyncData'
import { formatPercent, formatSeconds } from '../utils/format'
import RangePills from './RangePills.vue'
import StatCard from './StatCard.vue'

// État local : seul ce bloc a besoin de la période, inutile de la mettre dans un store ou dans l'URL.
const range = ref<ReadingRange>('24h')

// La ref range sert de source : changer de période relance la requête (et annule la précédente).
const { data: report, loading, error } = useAsyncData(range, fetchKpis)

// Un seul endroit pour décider quoi afficher : rien de chargé, aucun Reading sur la période, ou des KPI.
const kpis = computed(() => report.value?.plant ?? null)
const placeholder = computed(() => (loading.value && !report.value ? '…' : '—'))
</script>

<template>
  <section class="mt-10">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold tracking-tight">Performance de l'atelier</h2>
      <RangePills v-model="range" />
    </div>

    <p v-if="error" role="alert" class="mt-4 rounded-3xl bg-surface p-5 text-sm text-stone-500">{{ error }}</p>

    <!-- Les anciens chiffres restent affichés pendant le rechargement : on les estompe au lieu de les effacer. -->
    <div class="mt-4 grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-4" :class="{ 'opacity-50': loading }">
      <StatCard
        label="TRS"
        :value="kpis ? formatPercent(kpis.oee) : placeholder"
        :hint="kpis ? `Disponibilité × performance × qualité (${formatPercent(kpis.quality)})` : ''"
      />
      <StatCard
        label="Disponibilité"
        :value="kpis ? formatPercent(kpis.availability) : placeholder"
        :hint="kpis ? `Performance ${formatPercent(kpis.performance)} de la cadence nominale` : ''"
      />
      <StatCard
        label="MTBF"
        :value="kpis?.mtbf != null ? formatSeconds(kpis.mtbf) : placeholder"
        :hint="kpis && kpis.mtbf === null ? 'Aucune panne sur la période' : 'Temps moyen de marche entre deux pannes'"
      />
      <StatCard
        label="MTTR"
        :value="kpis?.mttr != null ? formatSeconds(kpis.mttr) : placeholder"
        hint="Temps moyen de réparation d'une panne"
      />
    </div>
  </section>
</template>
