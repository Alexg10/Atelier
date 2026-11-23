import { createRouter, createWebHistory, type LocationQueryValue } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

// On déclare les champs autorisés dans meta : TypeScript vérifie alors chaque route et chaque lecture de to.meta.
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

function positiveInt(value: LocationQueryValue | LocationQueryValue[] | undefined): number | undefined {
  const number = Number(value)
  return typeof value === 'string' && Number.isInteger(number) && number > 0 ? number : undefined
}

export const router = createRouter({
  // createWebHistory : de vraies URLs (/machines/3) via l'API History du navigateur, sans # dans l'URL.
  history: createWebHistory(),
  routes: [
    // La page d'accueil est importée normalement : elle fait partie du bundle principal.
    { path: '/', name: 'dashboard', component: DashboardView, meta: { title: 'Tableau de bord' } },
    {
      path: '/machines/:id',
      name: 'machine-detail',
      // Lazy loading : le code de la page est un fichier séparé, téléchargé seulement à la première visite.
      component: () => import('../views/MachineDetailView.vue'),
      // Le composant reçoit l'id en prop (et en nombre) : il ne dépend plus du routeur, plus simple à réutiliser et à tester.
      props: (route) => ({ id: Number(route.params.id) }),
      meta: { title: 'Fiche machine' },
      // Guard de route : exécuté avant d'entrer. Un id non numérique n'est pas une machine, on affiche la 404.
      beforeEnter: (to) => {
        if (/^\d+$/.test(String(to.params.id))) return true
        return {
          name: 'not-found',
          // On garde l'URL tapée par l'utilisateur dans la barre d'adresse.
          params: { pathMatch: to.path.slice(1).split('/') },
          query: to.query,
          hash: to.hash,
        }
      },
    },
    {
      path: '/work-orders',
      name: 'work-orders',
      component: () => import('../views/WorkOrdersView.vue'),
      meta: { title: 'Ordres de maintenance' },
    },
    {
      path: '/work-orders/new',
      name: 'work-order-new',
      component: () => import('../views/WorkOrderNewView.vue'),
      // La query devient des props typées ; une valeur absente ou invalide est simplement ignorée.
      props: (route) => ({
        machineId: positiveInt(route.query.machine),
        alertId: positiveInt(route.query.alert),
        title: typeof route.query.title === 'string' ? route.query.title : undefined,
      }),
      meta: { title: 'Nouvel ordre de maintenance' },
    },
    // Toute URL inconnue : le paramètre pathMatch capture le chemin entier.
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: 'Page introuvable' },
    },
  ],
})

// Guard global : appelé après chaque navigation réussie, quelle que soit la route.
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Atelier` : 'Atelier'
})
