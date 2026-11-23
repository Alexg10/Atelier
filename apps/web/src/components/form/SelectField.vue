<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label: string
  options: { value: string; label: string }[]
  error?: string
  disabled?: boolean
}>()

// Même contrat que TextField : le parent écrit v-model="form.machineId".
const model = defineModel<string>({ required: true })
const id = useId()
</script>

<template>
  <div>
    <label :for="id" class="text-sm font-medium text-ink">{{ label }}</label>
    <select
      :id="id"
      v-model="model"
      :disabled="disabled"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="mt-1.5 w-full rounded-2xl border bg-surface px-4 py-2.5 text-sm text-ink outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40 disabled:bg-canvas disabled:text-stone-500"
      :class="error ? 'border-ink' : 'border-stone-200'"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
    <p v-if="error" :id="`${id}-error`" class="mt-1 text-xs font-medium text-ink">{{ error }}</p>
  </div>
</template>
