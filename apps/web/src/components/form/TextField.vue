<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label: string
  error?: string
  placeholder?: string
}>()

// defineModel : la prop modelValue + l'événement update:modelValue, en une seule ref.
// Lire model lit la valeur du parent ; écrire model.value émet la mise à jour. Le parent écrit simplement v-model="…".
const model = defineModel<string>({ required: true })

// useId : un id unique et stable pour relier le <label>, le champ et le message d'erreur.
const id = useId()
</script>

<template>
  <div>
    <label :for="id" class="text-sm font-medium text-ink">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      type="text"
      :placeholder="placeholder"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="mt-1.5 w-full rounded-2xl border bg-surface px-4 py-2.5 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40"
      :class="error ? 'border-ink' : 'border-stone-200'"
    />
    <p v-if="error" :id="`${id}-error`" class="mt-1 text-xs font-medium text-ink">{{ error }}</p>
  </div>
</template>
