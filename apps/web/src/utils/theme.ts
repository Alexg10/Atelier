// Tailwind expose chaque token @theme en variable CSS (--color-brand…) : on la relit pour les libs qui dessinent en canvas.
// Une seule source de vérité pour les couleurs : style.css.
export function themeColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim()
}
