<!-- generic : le composant est paramétré par le type des lignes. Avec rows: WorkOrderSummary[], le slot
     #cell-status="{ row }" reçoit un row typé WorkOrderSummary (autocomplétion et vérification comprises). -->
<script setup lang="ts" generic="Row extends { id: number | string }">
import type { Column } from './dataTable'

defineProps<{
  /** null : premier chargement, on affiche un squelette. */
  rows: Row[] | null
  columns: Column<Row>[]
  loading?: boolean
  rowClass?: (row: Row) => string
}>()

defineSlots<
  {
    /** Une cellule personnalisée par colonne : #cell-status, #cell-machine… */
    [slot: `cell-${string}`]: (props: { row: Row }) => unknown
  } & {
    /** Affiché quand la liste est vide. */
    empty?: () => unknown
  }
>()
</script>

<template>
  <section class="overflow-x-auto rounded-3xl bg-surface p-2 transition-opacity" :class="{ 'opacity-50': loading && rows }">
    <table class="w-full text-left text-sm">
      <thead class="text-xs text-stone-400">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            class="px-4 py-3 font-medium"
            :class="{ 'text-right': column.align === 'right' }"
          >
            <span :class="{ 'sr-only': column.hideLabel }">{{ column.label }}</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-100">
        <tr v-for="row in rows ?? []" :key="row.id" :class="rowClass?.(row)">
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-4 py-3"
            :class="{ 'text-right': column.align === 'right' }"
          >
            <!-- Slot au nom dynamique, qui passe la ligne au parent (scoped slot).
                 Le contenu entre les balises est la valeur par défaut, utilisée si le parent ne remplit pas ce slot. -->
            <slot :name="`cell-${column.key}`" :row="row">{{ column.value?.(row) ?? '' }}</slot>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="rows === null" class="h-40 animate-pulse rounded-2xl bg-canvas" aria-hidden="true" />
    <div v-else-if="rows.length === 0" class="px-4 py-8 text-center text-sm text-stone-400">
      <slot name="empty">Aucun élément.</slot>
    </div>
  </section>
</template>
