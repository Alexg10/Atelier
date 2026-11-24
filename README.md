# Atelier

Une mini-supervision d'atelier de production avec sa maintenance (une GMAO légère) : dix machines remontent de la télémétrie en temps réel, l'app affiche leur état, crée des alertes quand un seuil est franchi, et permet de suivre les ordres de maintenance jusqu'à une vue 3D isométrique de l'atelier.

C'est aussi un **projet d'apprentissage de Vue 3** : chaque étape est une leçon, sur sa propre branche, avec un commit par étape (voir [Parcours](#parcours-dapprentissage)).

## Fonctionnalités

- **Tableau de bord** : grille des machines avec leur Health (ok / alerte / panne) et leurs dernières mesures, mise à jour en direct par SSE ; filtres et tri ; KPI de l'atelier (TRS, disponibilité, MTBF, MTTR) sur 1 h, 24 h ou 7 jours.
- **Fiche machine** : courbes de température, vibration et cadence agrégées côté serveur, seuils affichés, historique des alertes.
- **Alertes** : ouvertes et closes automatiquement par l'API quand un relevé franchit un seuil ou quand la machine tombe en panne, poussées en direct au front.
- **Ordres de maintenance** : création (y compris depuis une alerte), assignation, cycle de vie à faire → en cours → terminé ; vue liste avec filtres dans l'URL, ou kanban en glisser-déposer.
- **Vue 3D** : l'atelier en isométrique, piloté par la base et le flux temps réel ; machines animées quand elles produisent, Health en couleur, mesures au survol, clic vers la fiche.

Le vocabulaire du domaine (Machine, Reading, Status, Health, Alert, WorkOrder…) est défini dans [`GLOSSARY.md`](GLOSSARY.md).

## Démarrage

Prérequis : Node 22 (voir `.nvmrc`), pnpm 10, Docker.

```bash
pnpm install
cp .env.example .env && cp apps/api/.env.example apps/api/.env

pnpm db:up        # Postgres dans Docker (port 5433)
pnpm db:migrate   # crée le schéma
pnpm db:seed      # 10 machines, 4 utilisateurs, une semaine d'historique

pnpm dev:api      # API Fastify sur http://localhost:3001
pnpm dev:sim      # simulateur : un relevé par machine toutes les 5 s, pannes aléatoires
pnpm dev:web      # front sur http://localhost:5173
```

| Script | Rôle |
| --- | --- |
| `pnpm typecheck` | Vérifie les types de tous les paquets |
| `pnpm test` / `pnpm test:run` | Vitest en mode watch / une seule fois (nécessite Postgres pour les tests de l'API) |
| `pnpm build` | Build de production du front |

## Structure

```
apps/
  web/         Vue 3 + Vite : pages, composants, stores Pinia, composables, vue 3D (TresJS)
  api/         Fastify + Prisma : routes REST, flux SSE, règles d'alerte, agrégations SQL
  simulator/   Génère la télémétrie et provoque des pannes (aucune API externe)
packages/
  shared/      Types, schémas Zod et règles métier partagés par le front et le back
```

## Choix d'architecture

**Un paquet `shared` pour le contrat et les règles.** Les types échangés (`MachineOverview`, `WorkOrderSummary`…), les schémas Zod et les règles métier pures (`computeHealth`, `canTransition`, `computeKpis`) vivent à un seul endroit. Le formulaire du front valide avec le même schéma que l'API ; le kanban, la liste et l'API appliquent la même règle de transition. Les paquets sont consommés en TypeScript source (pas de build intermédiaire).

**SSE plutôt que WebSocket.** Le temps réel ne va que du serveur vers le navigateur : SSE suffit, passe par HTTP standard (proxy, auth, devtools), et le navigateur gère seul la reconnexion. Le front n'ouvre qu'une connexion pour toute l'app (store `live`), recharge en silence après une coupure pour rattraper les événements manqués, et le serveur envoie un battement régulier pour que les proxys ne coupent pas la connexion.

**L'API interprète, le simulateur ne fait que mesurer.** Le simulateur envoie des relevés bruts ; c'est l'API qui détecte les dépassements, ouvre et clôt les alertes, puis publie les événements. Une vraie machine pourrait remplacer le simulateur sans rien changer d'autre.

**Agréger dans Postgres.** Les courbes (`date_bin` + `generate_series`) et les KPI (fonction de fenêtre `lead()` pour pondérer chaque relevé par sa durée) sont calculés en SQL : le front reçoit une centaine de points, pas des milliers de relevés.

**État : local d'abord, store quand il est partagé, URL quand il se partage.**
- `ref` locale pour ce qui ne concerne qu'un composant (période des KPI, survol d'une machine 3D).
- Pinia (setup stores) pour l'état live partagé par plusieurs pages : machines, alertes, connexion SSE.
- L'URL pour ce qu'on veut retrouver ou envoyer : les filtres des ordres de maintenance.
- Les données d'une seule page passent par le composable `useAsyncData` (rechargement quand la source change, annulation de la requête précédente, états loading / error).

**Mises à jour optimistes.** Changer le statut ou l'intervenant d'un ordre met l'interface à jour tout de suite, puis la remplace par la réponse du serveur, ou revient en arrière si l'API refuse.

**Vue 3D.** TresJS est un *custom renderer* Vue pour Three.js : les objets 3D sont des composants, la réactivité met à jour la scène depuis le store. Les animations (60 images/s) écrivent directement dans les objets Three.js depuis la boucle de rendu, sans passer par la réactivité. Les machines sont des modèles construits avec des primitives (aucun fichier `.glb`). La route est chargée à la demande : Three.js (environ 800 Ko) n'est téléchargé qu'à l'ouverture de la vue.

**Design.** Tailwind CSS v4, couleurs déclarées comme tokens dans `apps/web/src/style.css`. Vert, orange et rouge sont réservés à la Health ; le bleu de la marque aux graphes, aux liens et au focus. Les composants génériques (`BaseModal`, `BaseTabs`, `DataTable`, `BaseBadge`) utilisent slots, `provide` / `inject` et `Teleport`.

## Tests

Principe : **tester la logique, pas l'UI**, et éviter les mocks là où ils masqueraient les vrais problèmes.

- **Fonctions pures** (le gros de la suite) : Health, transitions des ordres, règles d'alerte, KPI, formats, couleurs et cycles de la vue 3D.
- **Composables** : appelés directement, dans un `effectScope` ; `vue-router` simulé avec `vi.mock`.
- **Intégration API** : `app.inject()` de Fastify sur une vraie base Postgres de test (`atelier_test`, créée et migrée automatiquement), vidée avant chaque test. Prisma n'est pas mocké.

Les tests sont placés à côté du code (`kpi.ts` / `kpi.test.ts`). Une seule commande à la racine lance les trois paquets (projets Vitest).

## Intégration continue

`.github/workflows/ci.yml` lance, à chaque push sur `main` et à chaque pull request : installation, `pnpm typecheck`, `pnpm test:run` (avec un service Postgres) et `pnpm build`.

## Déploiement (pistes)

Rien n'est déployé à ce stade ; voici ce qu'il faudrait.

- **Postgres** : une base managée. Au démarrage de l'API, `prisma migrate deploy` applique les migrations.
- **API** : un conteneur Node 22 qui lance `src/server.ts` (via `tsx`, ou après compilation), avec `DATABASE_URL` et `API_PORT`. Une seule instance : le bus d'événements SSE est en mémoire (plusieurs instances demanderaient un relais, par exemple `LISTEN / NOTIFY` de Postgres).
- **Front** : `pnpm build` produit des fichiers statiques. Le front appelle `/api/…` : en production, un reverse proxy (Caddy, Nginx…) sert les fichiers et relaie `/api` vers l'API en retirant le préfixe, comme le fait le proxy de Vite en développement. Pour le flux SSE, la mise en tampon du proxy doit être désactivée.
- **Simulateur** : un processus à part, avec `API_URL` ; à remplacer par les vraies machines.

## Parcours d'apprentissage

Chaque étape a sa branche et son commit (`git log --oneline main`) ; le diff d'une étape montre exactement ce qu'elle a introduit.

| # | Étape | Concepts Vue |
| --- | --- | --- |
| 0 | Setup du monorepo | Anatomie d'un SFC, `<script setup>`, `createApp` |
| 1 | Back minimal : Prisma, seed, simulateur, `GET /machines` | (Fastify, Prisma) |
| 2 | `MachineCard` avec des données en dur | Template, `v-bind`, `v-if` / `v-show`, `v-for` + `key`, classes dynamiques |
| 3 | `MachineGrid` → `MachineCard` | `defineProps`, `defineEmits`, flux unidirectionnel |
| 4 | Filtres et tri | `ref`, `reactive`, `computed`, `watch` / `watchEffect` |
| 5 | Client API et premier composable | Composables, cycle de vie, loading / error |
| 6 | Vue Router | Routes, params, lazy loading, guards |
| 7 | Temps réel SSE | Effets de bord, nettoyage, reconnexion |
| 8 | Pinia | Setup stores, `storeToRefs` |
| 9 | Graphes de la fiche machine | Lib tierce, `watch` sur les params |
| 10 | Ordres de maintenance | `v-model`, `defineModel`, Zod partagé |
| 11 | Composants réutilisables | Slots, `provide` / `inject`, `Teleport` |
| 12 | Tests | Vitest, composables, `app.inject()` |
| 13 | KPI et kanban | `TransitionGroup`, drag & drop |
| 14 | Vue 3D isométrique | Custom renderer (TresJS), `useLoop`, `<component :is>` |
| 15 | README, CI | — |
