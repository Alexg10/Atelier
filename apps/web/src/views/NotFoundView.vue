<template>
  <div class="mx-auto mt-16 max-w-md rounded-3xl bg-surface p-8 text-center">
    <p class="text-5xl font-semibold text-stone-300">404</p>
    <h1 class="mt-3 text-xl font-semibold">Page introuvable</h1>
    <p class="mt-1 text-sm text-stone-500">Cette adresse ne correspond à aucune page de l'atelier.</p>
    <RouterLink
      :to="{ name: 'dashboard' }"
      class="mt-6 inline-block rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/85"
    >
      Retour au tableau de bord
    </RouterLink>
  </div>
</template>
