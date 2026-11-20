// Machines en dur pour construire l'UI avant de brancher l'API (étape 5).
import {
  computeHealth,
  machineProfiles,
  type MachineOverview,
  type MachineType,
  type ReadingValues,
} from '@atelier/shared'

const now = '2026-11-20T14:32:05.000Z'

function fixture(
  id: number,
  name: string,
  type: MachineType,
  line: string,
  reading: Omit<ReadingValues, 'timestamp'> | null,
  openAlertCount = 0,
): MachineOverview {
  return {
    id,
    name,
    type,
    line,
    thresholds: machineProfiles[type].thresholds,
    posX: 0,
    posZ: 0,
    rotation: 0,
    lastReading: reading ? { ...reading, timestamp: now } : null,
    openAlertCount,
    // Même règle que l'API : la Health est toujours calculée, jamais écrite à la main.
    health: computeHealth(reading?.status, openAlertCount),
  }
}

export const machineFixtures: MachineOverview[] = [
  fixture(1, 'Presse 1', 'press', 'Ligne A', { temperature: 61.2, vibration: 2.9, rate: 30.4, status: 'running' }),
  fixture(2, 'Presse 2', 'press', 'Ligne A', { temperature: 91.4, vibration: 3.1, rate: 29.5, status: 'running' }, 1),
  fixture(3, 'Robot A', 'robot', 'Ligne A', { temperature: 44.8, vibration: 1.7, rate: 15.2, status: 'running' }),
  fixture(4, 'CNC 1', 'cnc', 'Ligne A', { temperature: 49.5, vibration: 0.6, rate: 0, status: 'fault' }, 1),
  fixture(5, 'CNC 2', 'cnc', 'Ligne A', { temperature: 51.3, vibration: 2.1, rate: 6.2, status: 'running' }),
  fixture(6, 'Convoyeur 1', 'conveyor', 'Ligne B', { temperature: 22.4, vibration: 0.1, rate: 0, status: 'stopped' }),
  fixture(7, 'Four', 'oven', 'Ligne B', { temperature: 221.7, vibration: 0.8, rate: 12.1, status: 'running' }),
  fixture(8, 'Robot B', 'robot', 'Ligne B', { temperature: 46.1, vibration: 4.9, rate: 14.8, status: 'running' }, 1),
  fixture(9, 'CNC 3', 'cnc', 'Ligne B', { temperature: 50.2, vibration: 2.0, rate: 5.9, status: 'running' }),
  fixture(10, 'Convoyeur 2', 'conveyor', 'Ligne B', null),
]
