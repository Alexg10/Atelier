<script setup lang="ts">
import type { UserSummary } from '@atelier/shared'

defineProps<{
  users: UserSummary[]
  disabled?: boolean
}>()

// null : personne. Le <select> ne manipule que des chaînes : on convertit à l'aller et au retour.
const assigneeId = defineModel<number | null>({ required: true })

function onChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  assigneeId.value = value ? Number(value) : null
}
</script>

<template>
  <select
    :value="assigneeId === null ? '' : String(assigneeId)"
    :disabled="disabled"
    aria-label="Intervenant"
    class="rounded-full border-0 bg-canvas px-3 py-1 text-xs font-medium text-ink disabled:bg-transparent disabled:text-stone-400"
    @change="onChange"
  >
    <option value="">—</option>
    <option v-for="user in users" :key="user.id" :value="String(user.id)">{{ user.name }}</option>
  </select>
</template>
