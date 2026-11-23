<script setup lang="ts">
import { nextTick, onUnmounted, useId, useTemplateRef, watch } from 'vue'

defineProps<{
  title: string
}>()

// v-model:open="…" côté parent : la modale peut se fermer elle-même (Échap, clic sur le fond, bouton).
const open = defineModel<boolean>('open', { required: true })

// Les slots que la modale accepte, typés : le parent sait ce qu'il peut remplir et ce qu'il reçoit.
defineSlots<{
  /** Le contenu principal. */
  default(): unknown
  /** Les boutons du bas. Slot « scoped » : la modale lui passe sa fonction close. */
  footer?(props: { close: () => void }): unknown
}>()

const titleId = useId()
// useTemplateRef : accès à l'élément DOM portant ref="panel" (l'équivalent de useRef en React).
const panel = useTemplateRef<HTMLElement>('panel')
let previouslyFocused: HTMLElement | null = null

function close() {
  open.value = false
}

// À l'ouverture : on mémorise l'élément qui avait le focus et on le donne à la modale.
// À la fermeture : on le rend, pour que l'utilisateur au clavier reprenne là où il était.
watch(open, async (isOpen) => {
  if (isOpen) {
    previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    // nextTick : attendre que Vue ait inséré la modale dans le DOM avant de lui donner le focus.
    await nextTick()
    panel.value?.focus()
  } else {
    document.body.style.overflow = ''
    previouslyFocused?.focus()
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <!-- Teleport : le composant reste un enfant logique du parent (props, events, slots), mais son HTML est
       inséré à la fin de <body>. Il échappe ainsi aux overflow:hidden et z-index des conteneurs parents. -->
  <Teleport to="body">
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition-opacity duration-150"
      leave-active-class="transition-opacity duration-150"
    >
      <!-- @click.self : seul un clic sur le fond lui-même ferme la modale, pas un clic dans le panneau. -->
      <div
        v-if="open"
        class="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
        @click.self="close"
        @keydown.esc="close"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          class="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-xl outline-none"
        >
          <h2 :id="titleId" class="text-lg font-semibold tracking-tight text-ink">{{ title }}</h2>
          <div class="mt-3 text-sm text-stone-600">
            <slot />
          </div>
          <div v-if="$slots.footer" class="mt-6 flex justify-end gap-3">
            <slot name="footer" :close="close" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
