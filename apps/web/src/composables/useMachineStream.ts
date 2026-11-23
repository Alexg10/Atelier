import { onMounted, onUnmounted, ref } from 'vue'
import type { StreamEvents } from '@atelier/shared'

export type StreamStatus = 'connecting' | 'open' | 'closed'

type StreamEventName = keyof StreamEvents

type EventHandlers = {
  [Name in StreamEventName]?: (data: StreamEvents[Name]) => void
}

type Handlers = EventHandlers & {
  /** Appelé quand la connexion revient après une coupure : des événements ont pu être manqués entre-temps. */
  onReconnect?: () => void
}

const eventNames = ['machine', 'alert-opened', 'alert-cleared'] as const satisfies StreamEventName[]

/** Fonction pure (testable sans navigateur) : un message mal formé est ignoré plutôt que de faire planter l'app. */
export function parseStreamData<Name extends StreamEventName>(raw: string): StreamEvents[Name] | null {
  try {
    return JSON.parse(raw) as StreamEvents[Name]
  } catch {
    return null
  }
}

export function useMachineStream(handlers: Handlers) {
  const status = ref<StreamStatus>('connecting')
  let source: EventSource | null = null

  function listen<Name extends StreamEventName>(name: Name) {
    // On passe par EventHandlers : TS sait alors que le handler de « name » attend exactement StreamEvents[name].
    const handler: EventHandlers[Name] = handlers[name]
    if (!handler) return
    source?.addEventListener(name, (event) => {
      const data = parseStreamData<Name>(event.data)
      if (data) handler(data)
    })
  }

  // Effet de bord : on ouvre la connexion quand le composant apparaît…
  onMounted(() => {
    source = new EventSource('/api/stream')
    let hasBeenOpen = false

    source.onopen = () => {
      if (hasBeenOpen) handlers.onReconnect?.()
      hasBeenOpen = true
      status.value = 'open'
    }

    // EventSource se reconnecte tout seul (readyState CONNECTING) ; il n'abandonne que sur une erreur définitive (CLOSED).
    source.onerror = () => {
      status.value = source?.readyState === EventSource.CLOSED ? 'closed' : 'connecting'
    }

    for (const name of eventNames) listen(name)
  })

  // … et on la ferme quand il disparaît : sinon chaque visite du dashboard laisserait une connexion ouverte.
  onUnmounted(() => {
    source?.close()
    source = null
  })

  return { status }
}
