// Simulateur : récupère la liste des machines, puis envoie un relevé par machine toutes les 5 s.
import type { MachineOverview } from '@atelier/shared'
import type { ReadingInput } from '@atelier/shared/schemas'
import { createSimulatedMachine, tick } from './machine.ts'

const API_URL = process.env.API_URL ?? 'http://localhost:3001'
const TICK_MS = 5_000

async function sendReading(reading: ReadingInput) {
  const response = await fetch(`${API_URL}/readings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(reading),
  })
  if (!response.ok) console.error(`Machine ${reading.machineId} : ${response.status} ${await response.text()}`)
}

const machines: MachineOverview[] = await (await fetch(`${API_URL}/machines`)).json()
const simulated = machines.map((machine) => createSimulatedMachine(machine.id, machine.type))
console.log(`Simulateur démarré : ${simulated.length} machines, un relevé toutes les ${TICK_MS / 1000} s → ${API_URL}`)

setInterval(async () => {
  const now = Date.now()
  const readings = simulated.map((machine) => tick(machine, now))
  await Promise.allSettled(readings.map(sendReading))

  // Une ligne par tick pour suivre ce qui se passe sans noyer le terminal.
  const notRunning = readings.filter((reading) => reading.status !== 'running')
  const summary = notRunning.map((reading) => `#${reading.machineId} ${reading.status}`).join(', ')
  console.log(`${new Date(now).toLocaleTimeString('fr-FR')}  ${readings.length} relevés${summary ? `  (${summary})` : ''}`)
}, TICK_MS)
