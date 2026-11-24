import type { MachineHealth, MachineType } from '@atelier/shared'

/** Encombrement du modèle de chaque type de machine : [largeur, hauteur, profondeur], en mètres. */
export const machineSizes: Record<MachineType, [width: number, height: number, depth: number]> = {
  press: [2, 3.1, 1.6],
  cnc: [2.4, 2, 1.8],
  conveyor: [3.6, 1.2, 1.2],
  robot: [1.4, 2.4, 1.4],
  oven: [3, 2.2, 2],
}

/** Le socle arrondi sous chaque machine, et le liseré lumineux qui l'entoure. */
export const PLINTH_HEIGHT = 0.3
export const PLINTH_MARGIN = 0.8

/** Emprise du bureau de contrôle au sol : [largeur, profondeur], en mètres. */
export const CONTROL_ROOM_SIZE = [4.6, 3.6] as const

export const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Le token de style.css qui colore une Machine dans la vue 3D : la couleur ne dit que la Health. */
export function healthColorToken(health: MachineHealth): string {
  return `health-${health}`
}

/** Phase d'un cycle qui se répète toutes les `periodSeconds` : de 0 à 1, puis retour à 0. */
export const cyclePhase = (elapsedSeconds: number, periodSeconds: number, offset = 0) =>
  (((elapsedSeconds / periodSeconds + offset) % 1) + 1) % 1
