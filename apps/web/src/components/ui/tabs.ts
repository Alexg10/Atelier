import type { InjectionKey, Ref } from 'vue'

/** Ce que BaseTabs partage avec les BaseTabPanel placés n'importe où dans son contenu. */
export type TabsContext = {
  active: Readonly<Ref<string>>
  /** Préfixe d'ids unique, pour relier chaque onglet à son panneau (aria-controls / aria-labelledby). */
  baseId: string
}

// InjectionKey : une clé unique (Symbol) qui porte le type de la valeur ; inject(tabsKey) est alors typé TabsContext.
export const tabsKey: InjectionKey<TabsContext> = Symbol('tabs')
