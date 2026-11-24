// Client HTTP minimal : un seul endroit pour l'URL de base et la gestion des erreurs.
import type {
  AlertSummary,
  KpiReport,
  MachineOverview,
  ReadingHistory,
  ReadingRange,
  UserSummary,
  WorkOrderStatus,
  WorkOrderSummary,
} from '@atelier/shared'
import type { WorkOrderCreateInput, WorkOrderUpdateInput } from '@atelier/shared/schemas'

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

/** Écriture (POST / PATCH / DELETE) : le message d'erreur renvoyé par l'API est conservé pour l'afficher. */
async function apiSend<T>(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, UNREACHABLE_MESSAGE)
  }

  if (!response.ok) {
    const unreachable = [502, 503, 504].includes(response.status)
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new ApiError(
      response.status,
      unreachable ? UNREACHABLE_MESSAGE : (payload?.error ?? `${method} ${path} a échoué (${response.status})`),
    )
  }
  // 204 No Content : pas de corps à lire.
  return (response.status === 204 ? undefined : await response.json()) as T
}

export const fetchMachines = (signal?: AbortSignal) => apiGet<MachineOverview[]>('/machines', signal)
export const fetchMachine = (id: number, signal?: AbortSignal) => apiGet<MachineOverview>(`/machines/${id}`, signal)
export const fetchOpenAlerts = (signal?: AbortSignal) => apiGet<AlertSummary[]>('/alerts?open=true', signal)
export const fetchReadingHistory = (id: number, range: ReadingRange, signal?: AbortSignal) =>
  apiGet<ReadingHistory>(`/machines/${id}/readings?range=${range}`, signal)
export const fetchMachineAlerts = (machineId: number, signal?: AbortSignal) =>
  apiGet<AlertSummary[]>(`/alerts?machineId=${machineId}`, signal)
export const fetchKpis = (range: ReadingRange, signal?: AbortSignal) => apiGet<KpiReport>(`/kpis?range=${range}`, signal)
export const fetchUsers = (signal?: AbortSignal) => apiGet<UserSummary[]>('/users', signal)

export type WorkOrderFilters = { status?: WorkOrderStatus; machineId?: number; assigneeId?: number }

export function fetchWorkOrders(filters: WorkOrderFilters, signal?: AbortSignal) {
  // URLSearchParams encode les valeurs ; on n'envoie que les filtres renseignés.
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const query = params.size > 0 ? `?${params}` : ''
  return apiGet<WorkOrderSummary[]>(`/work-orders${query}`, signal)
}

export const createWorkOrder = (input: WorkOrderCreateInput) => apiSend<WorkOrderSummary>('POST', '/work-orders', input)
export const updateWorkOrder = (id: number, changes: WorkOrderUpdateInput) =>
  apiSend<WorkOrderSummary>('PATCH', `/work-orders/${id}`, changes)
export const deleteWorkOrder = (id: number) => apiSend<void>('DELETE', `/work-orders/${id}`)
