// Connexion au flux temps réel. Du TypeScript pur, sans Vue : ni ref ni cycle de vie, c'est l'appelant qui décide quand ouvrir et fermer.
import type { StreamEvents } from '@atelier/shared'

export type StreamStatus = 'connecting' | 'open' | 'closed'

type StreamEventName = keyof StreamEvents

type EventHandlers = {
  [Name in StreamEventName]?: (data: StreamEvents[Name]) => void
}

type Handlers = EventHandlers & {
  onStatusChange?: (status: StreamStatus) => void
  /** Appelé quand la connexion revient après une coupure : des événements ont pu être manqués entre-temps. */
  onReconnect?: () => void
}

const RETRY_MS = 3000
const eventNames = ['machine', 'alert-opened', 'alert-cleared'] as const satisfies StreamEventName[]

/** Fonction pure (testable sans navigateur) : un message mal formé est ignoré plutôt que de faire planter l'app. */
export function parseStreamData<Name extends StreamEventName>(raw: string): StreamEvents[Name] | null {
  try {
    return JSON.parse(raw) as StreamEvents[Name]
  } catch {
    return null
  }
}

export function openMachineStream(handlers: Handlers) {
  let source: EventSource | null = null
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let hasBeenOpen = false

  function listen<Name extends StreamEventName>(target: EventSource, name: Name) {
    const handler: EventHandlers[Name] = handlers[name]
    if (!handler) return
    target.addEventListener(name, (event) => {
      const data = parseStreamData<Name>(event.data)
      if (data) handler(data)
    })
  }

  function connect() {
    const target = new EventSource('/api/stream')
    source = target

    target.onopen = () => {
      if (hasBeenOpen) handlers.onReconnect?.()
      hasBeenOpen = true
      handlers.onStatusChange?.('open')
    }

    target.onerror = () => {
      if (target.readyState === EventSource.CLOSED) {
        // Réponse qui n'est pas du SSE (ex. erreur 5xx du proxy quand l'API est arrêtée) : EventSource abandonne
        // définitivement. On recrée donc nous-mêmes une connexion un peu plus tard.
        handlers.onStatusChange?.('closed')
        retryTimer = setTimeout(connect, RETRY_MS)
      } else {
        // Connexion coupée en cours de route : EventSource retente tout seul.
        handlers.onStatusChange?.('connecting')
      }
    }

    for (const name of eventNames) listen(target, name)
  }

  connect()

  return {
    close() {
      clearTimeout(retryTimer)
      source?.close()
      source = null
    },
  }
}
