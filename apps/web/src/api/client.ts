// Client HTTP minimal : un seul endroit pour l'URL de base et la gestion des erreurs.
import type { MachineOverview } from '@atelier/shared'

const BASE_URL = '/api'
const UNREACHABLE_MESSAGE = "Le serveur de l'atelier ne répond pas. Vérifiez que l'API est démarrée."

export class ApiError extends Error {
  constructor(
    public readonly status: number, // 0 = pas de réponse du tout (réseau coupé, serveur arrêté)
    message: string,
  ) {
    super(message)
  }
}

async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { signal })
  } catch (cause) {
    // Une requête annulée volontairement n'est pas une erreur à afficher : on la laisse remonter telle quelle.
    if (signal?.aborted) throw cause
    throw new ApiError(0, UNREACHABLE_MESSAGE)
  }

  if (!response.ok) {
    // 502 / 503 / 504 : le proxy est joignable mais l'API derrière lui ne répond pas.
    const unreachable = [502, 503, 504].includes(response.status)
    throw new ApiError(response.status, unreachable ? UNREACHABLE_MESSAGE : `GET ${path} a échoué (${response.status})`)
  }
  // Le type T est une promesse faite par le code, pas une vérification : on fait confiance au contrat partagé.
  return response.json() as Promise<T>
}

export const fetchMachines = (signal?: AbortSignal) => apiGet<MachineOverview[]>('/machines', signal)
export const fetchMachine = (id: number, signal?: AbortSignal) => apiGet<MachineOverview>(`/machines/${id}`, signal)
