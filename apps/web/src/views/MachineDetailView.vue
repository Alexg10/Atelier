<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { readingRanges, type ReadingBucket, type ReadingRange } from '@atelier/shared'
import { fetchMachineAlerts, fetchReadingHistory } from '../api/client'
import AlertHistory from '../components/AlertHistory.vue'
import FilterPill from '../components/FilterPill.vue'
import HealthBadge from '../components/HealthBadge.vue'
import MachineMetrics from '../components/MachineMetrics.vue'
import MetricChart from '../components/MetricChart.vue'
import { useAsyncData } from '../composables/useAsyncData'
import { useAlertsStore } from '../stores/alerts'
import { useMachinesStore } from '../stores/machines'

// Grâce à l'option props de la route, l'id arrive en prop (déjà converti en nombre) au lieu d'être lu dans useRoute().
const props = defineProps<{
  id: number
}>()

// Même store que le dashboard : la liste est déjà en mémoire, et chaque événement SSE met aussi cette fiche à jour.
const machinesStore = useMachinesStore()
const { machines, loading, error, machineById } = storeToRefs(machinesStore)

// computed sur props.id : changer de machine dans le sélecteur recalcule simplement la valeur, sans nouvel appel réseau.
const machine = computed(() => machineById.value.get(props.id) ?? null)

// Introuvable seulement une fois la liste chargée (sinon on afficherait l'erreur pendant le premier chargement).
const notFound = computed(() => !loading.value && machines.value.length > 0 && !machine.value)

// Période des courbes : état local, seul cet écran s'en sert.
const range = ref<ReadingRange>('24h')
const rangeLabels: Record<ReadingRange, string> = { '1h': '1 h', '24h': '24 h', '7d': '7 jours' }

// Source tableau : on recharge si la machine OU la période change (un getter pour la prop, la ref pour la période).
const {
  data: history,
  loading: historyLoading,
  error: historyError,
} = useAsyncData(
  () => [props.id, range.value] as const,
  ([machineId, selectedRange], signal) => fetchReadingHistory(machineId, selectedRange, signal),
)

type ChartConfig = { metric: Exclude<keyof ReadingBucket, 'timestamp'>; title: string; unit: string; threshold: number }

// Dérivé des seuils de la machine : changer de machine change aussi les lignes de seuil.
const charts = computed<ChartConfig[]>(() => {
  if (!machine.value) return []
  const { thresholds } = machine.value
  return [
    { metric: 'temperature', title: 'Température', unit: '°C', threshold: thresholds.temperature.max },
    { metric: 'vibration', title: 'Vibration', unit: 'mm/s', threshold: thresholds.vibration.max },
    { metric: 'rate', title: 'Cadence', unit: 'p/min', threshold: thresholds.rate.min },
  ]
})

// Les alertes en cours de cette machine, lues dans le store alimenté par le SSE.
// Leur liste d'ids sert de « signal » : dès qu'une alerte s'ouvre ou se ferme ici, l'historique se recharge.
const alertsStore = useAlertsStore()
const openAlertIds = computed(() =>
  alertsStore.openAlerts
    .filter((alert) => alert.machineId === props.id)
    .map((alert) => alert.id)
    .join(','),
)
const { data: alertHistory, error: alertHistoryError } = useAsyncData(
  () => [props.id, openAlertIds.value] as const,
  ([machineId], signal) => fetchMachineAlerts(machineId, signal),
)

// useRouter donne l'instance du routeur, pour naviguer depuis le code (useRoute, lui, décrit la route courante).
const router = useRouter()

function onMachineChange(event: Event) {
  const id = Number((event.target as HTMLSelectElement).value)
  // Même route, autre param : Vue Router réutilise ce composant, seule la prop id change.
  router.push({ name: 'machine-detail', params: { id } })
}

// Le titre générique posé par router.afterEach est précisé dès que la machine est connue.
watchEffect(() => {
  if (machine.value) document.title = `${machine.value.name} · Atelier`
})
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <RouterLink :to="{ name: 'dashboard' }" class="text-sm text-stone-500 hover:text-ink">← Tableau de bord</RouterLink>

    <label class="flex items-center gap-2 text-sm text-stone-500">
      Machine
      <!-- :value (et pas v-model) : la source de vérité reste l'URL, le select ne fait que proposer une navigation -->
      <select
        class="rounded-full border-0 bg-surface px-4 py-2 text-sm font-medium text-ink focus-visible:ring-2 focus-visible:ring-brand/40"
        :value="id"
        @change="onMachineChange"
      >
        <option v-for="option in machines" :key="option.id" :value="option.id">{{ option.name }}</option>
      </select>
    </label>
  </div>

  <div v-if="notFound" role="alert" class="mt-6 rounded-3xl bg-surface p-5 text-sm">
    <p class="font-medium text-ink">Machine introuvable</p>
    <p class="mt-0.5 text-stone-500">Aucune machine ne porte le numéro {{ id }}.</p>
  </div>

  <div v-else-if="error && !machine" role="alert" class="mt-6 rounded-3xl bg-surface p-5 text-sm">
    <p class="font-medium text-ink">Données indisponibles</p>
    <p class="mt-0.5 text-stone-500">{{ error }}</p>
  </div>

  <div v-else-if="!machine" class="mt-6 h-40 animate-pulse rounded-3xl bg-surface" aria-hidden="true" />

  <template v-else-if="machine">
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <h1 class="text-3xl font-semibold tracking-tight">{{ machine.name }}</h1>
      <HealthBadge :health="machine.health" />
    </div>
    <p class="mt-1 text-sm text-stone-500">{{ machine.line }} · {{ machine.type }}</p>

    <div class="mt-8 grid gap-4 lg:grid-cols-2">
      <section class="rounded-3xl bg-surface p-5">
        <h2 class="text-sm font-medium text-stone-500">Dernier relevé</h2>
        <MachineMetrics v-if="machine.lastReading" :machine="machine" class="mt-3" />
        <p v-else class="mt-3 text-sm italic text-stone-400">Aucun relevé reçu</p>
      </section>

      <section class="rounded-3xl bg-surface p-5">
        <h2 class="text-sm font-medium text-stone-500">Alertes récentes</h2>
        <p v-if="alertHistoryError" role="alert" class="mt-3 text-sm text-stone-500">{{ alertHistoryError }}</p>
        <div v-else-if="alertHistory" class="mt-1 max-h-64 overflow-y-auto">
          <AlertHistory :alerts="alertHistory" />
        </div>
      </section>
    </div>

    <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-semibold tracking-tight">Historique</h2>
      <div class="flex rounded-full bg-surface p-1">
        <FilterPill
          v-for="option in readingRanges"
          :key="option"
          :label="rangeLabels[option]"
          :active="range === option"
          @click="range = option"
        />
      </div>
    </div>

    <p v-if="historyError" role="alert" class="mt-4 rounded-3xl bg-surface p-5 text-sm text-stone-500">{{ historyError }}</p>

    <div v-else class="mt-4 grid gap-4 xl:grid-cols-3">
      <section v-for="chart in charts" :key="chart.metric" class="rounded-3xl bg-surface p-5">
        <h3 class="text-sm font-medium text-stone-500">{{ chart.title }} ({{ chart.unit }})</h3>
        <!-- Pendant un rechargement, on garde l'ancienne courbe (atténuée) plutôt que de la faire disparaître. -->
        <div v-if="history" class="mt-4 transition-opacity" :class="{ 'opacity-50': historyLoading }">
          <MetricChart :history="history" :metric="chart.metric" :unit="chart.unit" :threshold="chart.threshold" />
        </div>
        <div v-else class="mt-4 h-56 animate-pulse rounded-2xl bg-canvas" aria-hidden="true" />
      </section>
    </div>
  </template>
</template>
