<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import HealthBadge from '../components/HealthBadge.vue'
import MachineMetrics from '../components/MachineMetrics.vue'
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

    <section class="mt-8 max-w-xl rounded-3xl bg-surface p-5">
      <h2 class="text-sm font-medium text-stone-500">Dernier relevé</h2>
      <MachineMetrics v-if="machine.lastReading" :machine="machine" class="mt-3" />
      <p v-else class="mt-3 text-sm italic text-stone-400">Aucun relevé reçu</p>
    </section>

    <p class="mt-6 text-sm text-stone-400">Courbes, seuils et historique des pannes : étape 9.</p>
  </template>
</template>
