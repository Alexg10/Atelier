// Une machine simulée : elle connaît son comportement normal et produit un relevé à chaque tick.
// Elle ne connaît ni les alertes ni la base : c'est l'API qui interprète ce qu'elle envoie.
import { machineProfiles, type MachineStatus, type MachineType, type ReadingInput } from '@atelier/shared'

/** Probabilités par tick (un tick = 5 s) de voir démarrer chaque événement. */
const CHANCE_PER_TICK = {
  fault: 0.003, // ≈ une panne toutes les 30 min par machine
  stop: 0.002, // arrêt volontaire (changement de série)
  overheat: 0.003, // la température dépasse son seuil sans que la machine s'arrête
  vibrationSpike: 0.002,
}

type Anomaly = 'overheat' | 'vibrationSpike'

export type SimulatedMachine = {
  id: number
  type: MachineType
  status: MachineStatus
  statusUntil: number // fin de la panne ou de l'arrêt en cours (timestamp ms)
  anomaly: Anomaly | null
  anomalyUntil: number
}

const between = (min: number, max: number) => min + Math.random() * (max - min)
const round = (value: number) => Math.round(value * 10) / 10
const seconds = (min: number, max: number) => Math.round(between(min, max)) * 1000

export function createSimulatedMachine(id: number, type: MachineType): SimulatedMachine {
  return { id, type, status: 'running', statusUntil: 0, anomaly: null, anomalyUntil: 0 }
}

/** Fait évoluer l'état de la machine (début / fin d'événements). */
function evolve(machine: SimulatedMachine, now: number) {
  if (machine.status !== 'running' && now >= machine.statusUntil) machine.status = 'running'
  if (machine.anomaly && now >= machine.anomalyUntil) machine.anomaly = null

  if (machine.status === 'running') {
    if (Math.random() < CHANCE_PER_TICK.fault) {
      machine.status = 'fault'
      machine.statusUntil = now + seconds(60, 300) // une panne dure 1 à 5 min
    } else if (Math.random() < CHANCE_PER_TICK.stop) {
      machine.status = 'stopped'
      machine.statusUntil = now + seconds(60, 180)
    }
  }

  if (!machine.anomaly && machine.status === 'running') {
    if (Math.random() < CHANCE_PER_TICK.overheat) {
      machine.anomaly = 'overheat'
      machine.anomalyUntil = now + seconds(30, 120)
    } else if (Math.random() < CHANCE_PER_TICK.vibrationSpike) {
      machine.anomaly = 'vibrationSpike'
      machine.anomalyUntil = now + seconds(20, 60)
    }
  }
}

export function tick(machine: SimulatedMachine, now: number): ReadingInput {
  evolve(machine, now)

  const { nominal, thresholds } = machineProfiles[machine.type]
  const noise = (value: number) => value * (1 + between(-0.05, 0.05))

  let temperature = noise(nominal.temperature)
  let vibration = noise(nominal.vibration)
  let rate = noise(nominal.rate)

  if (machine.status !== 'running') rate = 0
  if (machine.status === 'fault') vibration = noise(nominal.vibration * 0.3)
  if (machine.status === 'stopped') vibration = noise(0.1)
  if (machine.anomaly === 'overheat') temperature = thresholds.temperature.max + between(3, 15)
  if (machine.anomaly === 'vibrationSpike') vibration = thresholds.vibration.max * between(1.1, 1.6)

  return {
    machineId: machine.id,
    timestamp: new Date(now).toISOString(),
    temperature: round(temperature),
    vibration: round(vibration),
    rate: round(rate),
    status: machine.status,
  }
}
