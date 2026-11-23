// Bus d'événements interne : la route POST /readings publie, le flux SSE (étape 7.2) s'abonne.
import { EventEmitter } from 'node:events'
import type { StreamEvents } from '@atelier/shared'

// Chaque événement est typé : emit('machine', …) n'accepte qu'un MachineOverview.
type EventMap = { [Name in keyof StreamEvents]: [StreamEvents[Name]] }

export const events = new EventEmitter<EventMap>()

// Un abonné par onglet ouvert : on relève la limite par défaut (10) pour éviter un avertissement trompeur.
events.setMaxListeners(100)
