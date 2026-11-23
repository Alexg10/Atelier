<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { workOrderPriorities, type WorkOrderSummary } from '@atelier/shared'
import { workOrderCreateSchema } from '@atelier/shared/schemas'
import { ApiError, createWorkOrder, fetchUsers } from '../api/client'
import { useAsyncData } from '../composables/useAsyncData'
import { useMachinesStore } from '../stores/machines'
import { workOrderPriorityLabels } from '../utils/workOrders'
import SelectField from './form/SelectField.vue'
import TextField from './form/TextField.vue'

const props = defineProps<{
  /** Valeurs de départ (création depuis une alerte : machine et alerte imposées, titre suggéré). */
  initial?: { machineId?: number; alertId?: number; title?: string }
}>()

const emit = defineEmits<{
  created: [workOrder: WorkOrderSummary]
  cancel: []
}>()

const { machines } = storeToRefs(useMachinesStore())
const { data: users } = useAsyncData(
  () => null,
  (_, signal) => fetchUsers(signal),
)

// L'état du formulaire : des chaînes, comme ce que manipulent les champs HTML. La conversion se fait à la validation.
const form = reactive({
  machineId: props.initial?.machineId ? String(props.initial.machineId) : '',
  title: props.initial?.title ?? '',
  priority: 'medium',
  assigneeId: '',
})
const alertId = props.initial?.alertId ?? null

const machineOptions = computed(() => [
  { value: '', label: 'Choisir une machine…' },
  ...machines.value.map((machine) => ({ value: String(machine.id), label: machine.name })),
])
const priorityOptions = workOrderPriorities.map((priority) => ({ value: priority, label: workOrderPriorityLabels[priority] }))
const assigneeOptions = computed(() => [
  { value: '', label: 'Personne pour le moment' },
  ...(users.value ?? []).map((user) => ({ value: String(user.id), label: user.name })),
])

// Le même schéma que l'API : si le formulaire le valide, le serveur l'acceptera (à l'état de la base près).
const validation = computed(() =>
  workOrderCreateSchema.safeParse({
    machineId: Number(form.machineId),
    alertId,
    title: form.title,
    priority: form.priority,
    assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
  }),
)

// On ne crie pas avant le premier envoi ; ensuite, les erreurs se mettent à jour à chaque frappe (c'est un computed).
const submitted = ref(false)
const errors = computed(() => {
  const result: Partial<Record<string, string>> = {}
  if (!submitted.value || validation.value.success) return result
  for (const issue of validation.value.error.issues) {
    const field = String(issue.path[0])
    result[field] ??= issue.message
  }
  return result
})

const submitting = ref(false)
const serverError = ref<string | null>(null)

async function submit() {
  submitted.value = true
  serverError.value = null
  if (!validation.value.success) return

  submitting.value = true
  try {
    const workOrder = await createWorkOrder(validation.value.data)
    emit('created', workOrder)
  } catch (cause) {
    // 409 : la requête était valide, mais l'état a changé entre-temps (quelqu'un a déjà créé un ordre pour cette alerte).
    serverError.value =
      cause instanceof ApiError && cause.status === 409
        ? 'Cette alerte a déjà un ordre de maintenance.'
        : cause instanceof Error
          ? cause.message
          : 'Erreur inconnue'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- .prevent : équivalent de event.preventDefault(), la page ne se recharge pas à l'envoi. novalidate : c'est Zod qui valide. -->
  <form novalidate class="grid gap-5" @submit.prevent="submit">
    <p v-if="alertId" class="rounded-2xl bg-brand-soft px-4 py-3 text-sm text-brand">
      Créé depuis une alerte : l'alerte sera acquittée.
    </p>

    <!-- v-model sur nos propres composants : grâce à defineModel, form.machineId suit la valeur choisie. -->
    <SelectField
      v-model="form.machineId"
      label="Machine"
      :options="machineOptions"
      :error="errors.machineId"
      :disabled="alertId !== null"
    />
    <TextField v-model="form.title" label="Titre" placeholder="Ex. Remplacer le roulement" :error="errors.title" />

    <div class="grid gap-5 sm:grid-cols-2">
      <SelectField v-model="form.priority" label="Priorité" :options="priorityOptions" :error="errors.priority" />
      <SelectField v-model="form.assigneeId" label="Intervenant" :options="assigneeOptions" :error="errors.assigneeId" />
    </div>

    <p v-if="serverError" role="alert" class="text-sm font-medium text-ink">{{ serverError }}</p>

    <div class="flex justify-end gap-3">
      <button
        type="button"
        class="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-ink transition hover:bg-stone-50"
        @click="emit('cancel')"
      >
        Annuler
      </button>
      <button
        type="submit"
        class="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/85 disabled:opacity-50"
        :disabled="submitting"
      >
        {{ submitting ? 'Création…' : "Créer l'ordre" }}
      </button>
    </div>
  </form>
</template>
