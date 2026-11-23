<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { WorkOrderSummary } from '@atelier/shared'
import WorkOrderForm from '../components/WorkOrderForm.vue'

// Valeurs de départ lues dans l'URL par la route (?machine=3&alert=29&title=…) : un lien suffit à préremplir le formulaire.
const props = defineProps<{
  machineId?: number
  alertId?: number
  title?: string
}>()

const router = useRouter()

function onCreated(workOrder: WorkOrderSummary) {
  // push : la création est une vraie étape de navigation (le bouton précédent ramène au formulaire vide).
  router.push({ name: 'work-orders', query: { machine: workOrder.machineId } })
}
</script>

<template>
  <RouterLink :to="{ name: 'work-orders' }" class="text-sm text-stone-500 hover:text-ink">← Ordres de maintenance</RouterLink>
  <h1 class="mt-4 text-3xl font-semibold tracking-tight">Nouvel ordre de maintenance</h1>

  <section class="mt-8 max-w-2xl rounded-3xl bg-surface p-6">
    <WorkOrderForm :initial="props" @created="onCreated" @cancel="router.back()" />
  </section>
</template>
