// Données fixes du seed : l'atelier (machines et utilisateurs).
import type { MachineType, UserRole } from '../src/generated/prisma/client.ts'

/** Deux lignes de 5 machines ; posX / posZ placent les machines dans la future vue 3D. */
export const machines: { name: string; type: MachineType; line: string; posX: number; posZ: number }[] = [
  { name: 'Presse 1', type: 'press', line: 'Ligne A', posX: 0, posZ: 0 },
  { name: 'Presse 2', type: 'press', line: 'Ligne A', posX: 4, posZ: 0 },
  { name: 'Robot A', type: 'robot', line: 'Ligne A', posX: 8, posZ: 0 },
  { name: 'CNC 1', type: 'cnc', line: 'Ligne A', posX: 12, posZ: 0 },
  { name: 'CNC 2', type: 'cnc', line: 'Ligne A', posX: 16, posZ: 0 },
  { name: 'Convoyeur 1', type: 'conveyor', line: 'Ligne B', posX: 0, posZ: 8 },
  { name: 'Four', type: 'oven', line: 'Ligne B', posX: 4, posZ: 8 },
  { name: 'Robot B', type: 'robot', line: 'Ligne B', posX: 8, posZ: 8 },
  { name: 'CNC 3', type: 'cnc', line: 'Ligne B', posX: 12, posZ: 8 },
  { name: 'Convoyeur 2', type: 'conveyor', line: 'Ligne B', posX: 16, posZ: 8 },
]

export const users: { name: string; role: UserRole }[] = [
  { name: 'Camille Martin', role: 'manager' },
  { name: 'Hugo Bernard', role: 'technician' },
  { name: 'Inès Petit', role: 'technician' },
  { name: 'Lucas Moreau', role: 'operator' },
]
