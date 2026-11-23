<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
    <!-- v-for sur un nombre : n va de 1 à 8 (pratique pour des placeholders) -->
    <div v-for="n in 8" :key="n" class="h-56 animate-pulse rounded-3xl bg-surface p-5">
      <div class="h-4 w-1/2 rounded-full bg-stone-100" />
      <div class="mt-2 h-3 w-1/3 rounded-full bg-stone-100" />
      <div class="mt-6 grid grid-cols-3 gap-2">
        <div v-for="m in 3" :key="m" class="h-20 rounded-2xl bg-stone-100" />
      </div>
    </div>
  </div>
</template>
