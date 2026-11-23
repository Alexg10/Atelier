<script setup lang="ts">
import { watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import HealthBadge from '../components/HealthBadge.vue'
import MachineMetrics from '../components/MachineMetrics.vue'
import { useMachine } from '../composables/useMachine'
import { useMachines } from '../composables/useMachines'

// Grâce à l'option props de la route, l'id arrive en prop (déjà converti en nombre) au lieu d'être lu dans useRoute().
const props = defineProps<{
  id: number
}>()

// On passe un getter, pas props.id : sinon le composable recevrait le nombre du premier rendu et ne verrait jamais le changement.
const { machine, loading, error } = useMachine(() => props.id)

// La liste sert seulement au sélecteur : pas de polling ici.
const { machines } = useMachines()

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

  <div v-if="error" role="alert" class="mt-6 rounded-3xl bg-surface p-5 text-sm">
    <p class="font-medium text-ink">Machine introuvable</p>
    <p class="mt-0.5 text-stone-500">{{ error }}</p>
  </div>

  <div v-else-if="loading && !machine" class="mt-6 h-40 animate-pulse rounded-3xl bg-surface" aria-hidden="true" />

  <template v-else-if="machine">
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <h1 class="text-3xl font-semibold tracking-tight">{{ machine.name }}</h1>
      <HealthBadge :health="machine.health" />
    </div>
    <p class="mt-1 text-sm text-stone-500">{{ machine.line }} · {{ machine.type }}</p>

    <section class="mt-8 max-w-xl rounded-3xl bg-surface p-5">
      <h2 class="text-sm font-medium text-stone-500">Dernier relevé</h2>
      <MachineMetrics v-if="machine.lastReading" :machine="machine" class="mt-3" />
      <p v-else class="mt-3 text-sm italic text-stone-400">Aucun relevé reçu</p>
    </section>

    <p class="mt-6 text-sm text-stone-400">Courbes, seuils et historique des pannes : étape 9.</p>
  </template>
</template>
