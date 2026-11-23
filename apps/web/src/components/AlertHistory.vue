<script setup lang="ts">
import type { AlertSummary } from '@atelier/shared'
import { alertTypeLabels, formatDuration, formatTriggeringValue } from '../utils/alerts'

defineProps<{
  alerts: AlertSummary[]
}>()

function formatStart(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <p v-if="alerts.length === 0" class="text-sm italic text-stone-400">Aucune alerte enregistrée</p>

  <ol v-else class="divide-y divide-stone-100">
    <li v-for="alert in alerts" :key="alert.id" class="flex items-center gap-3 py-2.5 text-sm">
      <!-- Le point reprend la Health que l'alerte provoque tant qu'elle est en cours ; gris une fois revenue à la normale. -->
      <span
        class="size-2 shrink-0 rounded-full"
        :class="alert.clearedAt ? 'bg-stone-300' : alert.type === 'fault' ? 'bg-health-fault' : 'bg-health-warning'"
        aria-hidden="true"
      />
      <div class="min-w-0 flex-1">
        <p class="font-medium text-ink">
          {{ alertTypeLabels[alert.type] }}
          <span v-if="formatTriggeringValue(alert)" class="font-normal text-stone-500">
            · {{ formatTriggeringValue(alert) }}
          </span>
        </p>
        <p class="text-xs text-stone-400">{{ formatStart(alert.createdAt) }}</p>
      </div>
      <span class="shrink-0 text-xs" :class="alert.clearedAt ? 'text-stone-500' : 'font-medium text-ink'">
        {{ alert.clearedAt ? formatDuration(alert.createdAt, alert.clearedAt) : 'En cours' }}
      </span>
      <!-- Une alerte en cours, pas encore prise en charge : lien vers le formulaire prérempli par la query. -->
      <RouterLink
        v-if="!alert.clearedAt && !alert.acknowledgedAt"
        :to="{
          name: 'work-order-new',
          query: { machine: alert.machineId, alert: alert.id, title: alertTypeLabels[alert.type] },
        }"
        class="shrink-0 rounded-full bg-ink px-3 py-1 text-xs font-medium text-white transition hover:bg-ink/85"
      >
        Créer un ordre
      </RouterLink>
      <span v-else-if="!alert.clearedAt" class="shrink-0 text-xs text-stone-400">Prise en charge</span>
    </li>
  </ol>
</template>
