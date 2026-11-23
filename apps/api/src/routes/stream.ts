import type { FastifyInstance } from 'fastify'
import type { StreamEvents } from '@atelier/shared'
import { events } from '../events.ts'

const HEARTBEAT_MS = 15_000
const eventNames = ['machine', 'alert-opened', 'alert-cleared'] as const satisfies (keyof StreamEvents)[]

export async function streamRoutes(app: FastifyInstance) {
  // Server-Sent Events : une réponse HTTP qui ne se termine jamais, dans laquelle on écrit un message par événement.
  app.get('/stream', (request, reply) => {
    // On reprend la main sur la réponse brute de Node : Fastify ne doit pas tenter de la clore lui-même.
    reply.hijack()
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    })
    // retry : délai (ms) avant que le navigateur se reconnecte tout seul si la connexion tombe.
    reply.raw.write('retry: 3000\n\n')

    // Format SSE : « event: <nom> » puis « data: <json> », et une ligne vide pour terminer le message.
    const listeners = eventNames.map((name) => {
      const listener = (data: StreamEvents[typeof name]) => {
        reply.raw.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
      }
      events.on(name, listener)
      return { name, listener }
    })

    // Un commentaire (ligne qui commence par « : ») régulier empêche les proxys de couper une connexion silencieuse.
    const heartbeat = setInterval(() => reply.raw.write(': ping\n\n'), HEARTBEAT_MS)

    // Onglet fermé, navigation, coupure réseau : on se désabonne, sinon on écrirait dans le vide (fuite mémoire).
    request.raw.on('close', () => {
      clearInterval(heartbeat)
      for (const { name, listener } of listeners) events.off(name, listener)
    })
  })
}
