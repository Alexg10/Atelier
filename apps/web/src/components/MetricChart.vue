<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { ReadingBucket, ReadingHistory } from '@atelier/shared'
import { themeColor } from '../utils/theme'

// Chart.js est modulaire : on n'enregistre que les briques utilisées (le bundle reste léger).
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler)

type Metric = Exclude<keyof ReadingBucket, 'timestamp'>

const props = defineProps<{
  history: ReadingHistory
  metric: Metric
  unit: string
  /** Seuil tracé en pointillés (max pour température / vibration, min pour la cadence). */
  threshold?: number
}>()

function formatLabel(timestamp: string) {
  const date = new Date(timestamp)
  return props.history.range === '7d'
    ? date.toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit' })
    : date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// vue-chartjs n'observe pas l'intérieur des objets : on lui donne un nouvel objet (computed) à chaque changement de données.
const chartData = computed<ChartData<'line', (number | null)[]>>(() => {
  const brand = themeColor('brand')
  const buckets = props.history.buckets
  return {
    labels: buckets.map((bucket) => formatLabel(bucket.timestamp)),
    datasets: [
      {
        label: props.unit,
        data: buckets.map((bucket) => bucket[props.metric]),
        borderColor: brand,
        backgroundColor: `${brand}1a`,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        // false : un intervalle sans relevé (null) coupe la ligne au lieu de relier les points autour.
        spanGaps: false,
      },
      ...(props.threshold === undefined
        ? []
        : [
            {
              label: 'Seuil',
              data: buckets.map(() => props.threshold ?? null),
              borderColor: themeColor('ink'),
              borderDash: [6, 4],
              borderWidth: 1,
              pointRadius: 0,
            },
          ]),
    ],
  }
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  // Le graphe prend la hauteur de son conteneur (fixée en Tailwind) au lieu d'un ratio imposé.
  maintainAspectRatio: false,
  animation: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
    y: { grid: { color: '#0000000d' }, border: { display: false } },
  },
}
</script>

<template>
  <div class="h-56">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
