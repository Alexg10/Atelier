// Vocabulaire commun au front et au back (voir GLOSSARY.md).

/** Ce que la machine déclare d'elle-même. */
export type MachineStatus = 'running' | 'stopped' | 'fault'

/** Ce que l'app déduit (Status + alertes ouvertes) : pilote la couleur. */
export type MachineHealth = 'ok' | 'warning' | 'fault'
