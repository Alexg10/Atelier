// Seed : remplit la base avec l'atelier + 7 jours d'historique (1 relevé / minute / machine),
// dont quelques pannes et surchauffes déjà terminées, avec leurs alertes et ordres de maintenance.
import { prisma } from '../src/db.ts'
import type { AlertType, MachineStatus, MachineType } from '../src/generated/prisma/client.ts'
import { machineProfiles as profiles } from '@atelier/shared'
import { machines, users } from './seed-data.ts'

const MINUTE = 60_000
const HISTORY_DAYS = 7

// Générateur pseudo-aléatoire à graine fixe : le seed produit toujours le même historique.
let state = 42
function random() {
  state = (state + 0x6d2b79f5) | 0
  let t = Math.imul(state ^ (state >>> 15), 1 | state)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const between = (min: number, max: number) => min + random() * (max - min)
const round = (value: number) => Math.round(value * 10) / 10

/** Épisode anormal à injecter dans l'historique d'une machine. */
type Episode = { kind: 'fault' | 'overheat'; start: number; end: number }

/** Choisit un début d'épisode un jour au hasard, pendant les heures de production. */
function randomWorkingTime(from: number) {
  const day = Math.floor(between(0, HISTORY_DAYS - 1))
  const date = new Date(from + day * 24 * 60 * MINUTE)
  date.setHours(Math.floor(between(8, 19)), Math.floor(between(0, 60)), 0, 0)
  return date.getTime()
}

function randomEpisodes(from: number): Episode[] {
  const episodes: Episode[] = []
  // Ajoute un épisode seulement s'il ne chevauche pas un épisode existant.
  const tryAdd = (kind: Episode['kind'], minMinutes: number, maxMinutes: number) => {
    const start = randomWorkingTime(from)
    const end = start + Math.round(between(minMinutes, maxMinutes)) * MINUTE
    const overlaps = episodes.some((episode) => start < episode.end && end > episode.start)
    if (!overlaps) episodes.push({ kind, start, end })
  }

  tryAdd('fault', 15, 90)
  tryAdd('fault', 15, 90)
  if (random() < 0.6) tryAdd('overheat', 10, 40)
  return episodes.sort((a, b) => a.start - b.start)
}

/** L'atelier est arrêté (Stop planifié) la nuit, de 22 h à 6 h. */
const isNight = (time: number) => {
  const hour = new Date(time).getHours()
  return hour >= 22 || hour < 6
}

function buildReading(type: MachineType, time: number, episodes: Episode[]) {
  const { nominal, thresholds } = profiles[type]
  const noise = (value: number) => value * (1 + between(-0.05, 0.05))
  const current = episodes.find((episode) => time >= episode.start && time < episode.end)

  let status: MachineStatus = 'running'
  let temperature = noise(nominal.temperature)
  let vibration = noise(nominal.vibration)
  let rate = noise(nominal.rate)

  if (current?.kind === 'fault') {
    status = 'fault'
    rate = 0
    vibration = noise(nominal.vibration * 0.3)
  } else if (isNight(time)) {
    status = 'stopped'
    rate = 0
    temperature = noise(22)
    vibration = noise(0.1)
  } else if (current?.kind === 'overheat') {
    temperature = thresholds.temperature.max + between(3, 15)
  }

  return { timestamp: new Date(time), status, temperature: round(temperature), vibration: round(vibration), rate: round(rate) }
}

async function main() {
  // On repart d'une base vide : le seed peut être relancé autant de fois qu'on veut.
  // RESTART IDENTITY remet les compteurs d'id à 1 (la Presse 1 garde l'id 1 d'un seed à l'autre).
  await prisma.$executeRaw`TRUNCATE "WorkOrder", "Alert", "Reading", "Machine", "User" RESTART IDENTITY`

  await prisma.user.createMany({ data: users })
  const technicians = await prisma.user.findMany({ where: { role: 'technician' } })

  const now = Math.floor(Date.now() / MINUTE) * MINUTE
  const from = now - HISTORY_DAYS * 24 * 60 * MINUTE

  for (const definition of machines) {
    const machine = await prisma.machine.create({
      data: { ...definition, thresholds: profiles[definition.type].thresholds },
    })
    const episodes = randomEpisodes(from)

    const readings = []
    for (let time = from; time < now; time += MINUTE) {
      readings.push({ machineId: machine.id, ...buildReading(machine.type, time, episodes) })
    }
    await prisma.reading.createMany({ data: readings })

    // Chaque épisode devient une alerte terminée ; les pannes ont toujours un ordre de maintenance clos.
    for (const episode of episodes) {
      const firstReading = readings.find((reading) => reading.timestamp.getTime() >= episode.start)
      const type: AlertType = episode.kind === 'fault' ? 'fault' : 'temperature'
      const alert = await prisma.alert.create({
        data: {
          machineId: machine.id,
          type,
          value: type === 'temperature' ? firstReading?.temperature : null,
          createdAt: new Date(episode.start),
          acknowledgedAt: new Date(episode.start + 3 * MINUTE),
          clearedAt: new Date(episode.end),
        },
      })

      if (type === 'fault' || random() < 0.5) {
        await prisma.workOrder.create({
          data: {
            machineId: machine.id,
            alertId: alert.id,
            title: type === 'fault' ? `Panne ${machine.name}` : `Surchauffe ${machine.name}`,
            priority: type === 'fault' ? 'high' : 'medium',
            status: 'done',
            assigneeId: technicians[Math.floor(random() * technicians.length)].id,
            createdAt: new Date(episode.start + 3 * MINUTE),
            closedAt: new Date(episode.end + 10 * MINUTE),
          },
        })
      }
    }
    console.log(`✓ ${machine.name} : ${readings.length} relevés, ${episodes.length} alertes`)
  }

  // Deux ordres préventifs ouverts, sans alerte d'origine.
  const conveyor = await prisma.machine.findFirstOrThrow({ where: { type: 'conveyor' } })
  const oven = await prisma.machine.findFirstOrThrow({ where: { type: 'oven' } })
  await prisma.workOrder.createMany({
    data: [
      { machineId: conveyor.id, title: 'Graisser les rouleaux', priority: 'low', status: 'todo' },
      { machineId: oven.id, title: 'Contrôle des résistances', priority: 'medium', status: 'in_progress', assigneeId: technicians[0].id },
    ],
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
