/** Une colonne de DataTable : la clé sert aussi à nommer le slot de cellule (#cell-<key>). */
export type Column<Row> = {
  key: string
  label: string
  /** Texte affiché si aucun slot #cell-<key> n'est fourni. */
  value?: (row: Row) => string
  /** En-tête lisible seulement par les lecteurs d'écran (ex. colonne d'actions). */
  hideLabel?: boolean
  align?: 'left' | 'right'
}
