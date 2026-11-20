# Atelier — Supervision d'atelier industriel (projet d'apprentissage Vue.js)

## Contexte

Je suis Alexandre, développeur front-end (Next.js / React / TypeScript / Tailwind au quotidien).
Je construis ce projet pour **réviser et réapprendre Vue.js** après un entretien chez Fabrik (stack Vue 3).
Je connais peu Node.js côté backend.

**Ce projet est un cours autant qu'un projet.** Claude écrit le code, étape par étape, et je le relis pour comprendre. L'objectif n°1 est que je comprenne Vue 3 en lisant un code clair et bien expliqué. Le livrable vient en second.

---

## Mode de travail (IMPORTANT, à respecter tout au long de la session)

1. **Step by step.** On avance une étape à la fois (voir le plan plus bas). À la fin de chaque étape, arrête-toi et attends mon feu vert avant de passer à la suivante.
2. **C'est toi qui écris le code, moi je relis.** Je n'écris pas le code moi-même. Mon but est de pouvoir **lire et comprendre** tout ce que tu produis pour me remettre à Vue.
3. **Code pensé pour être lu.**
   - Des changements courts : un ou quelques fichiers par sous-étape, pas 300 lignes d'un coup.
   - Un code simple et idiomatique plutôt que malin ; des noms explicites.
   - Des commentaires seulement sur les lignes qui illustrent un concept Vue (pas de paraphrase du code).
   - Construis progressivement : une version simple d'abord, puis on l'enrichit. Par exemple, des données en dur avant l'appel API, du state local avant Pinia.
4. **Explication à chaque sous-étape**, après avoir écrit le code :
   - ce que tu as fait et pourquoi, fichier par fichier ;
   - le ou les concepts Vue en jeu (le « pourquoi », pas seulement le « comment ») ;
   - le **parallèle avec React / Next.js** quand c'est utile (ex. `ref` vs `useState`, `computed` vs `useMemo`, `watch` vs `useEffect`, slots vs `children`, composables vs hooks, Pinia vs Zustand/Context) ;
   - les pièges classiques (perte de réactivité en déstructurant, `.value` oublié, etc.) ;
   - ce que je dois regarder dans le navigateur pour vérifier que ça marche.
5. **Checkpoint en fin d'étape.** Résume en 3 à 5 points ce qu'il faut retenir, puis pose-moi 2 ou 3 questions courtes de révision (type entretien). Ensuite, propose l'étape suivante.
6. **Commit par étape.** Un commit git propre à la fin de chaque étape (ex. `step-04: réactivité`), pour que je puisse revoir le diff de chaque leçon.
7. **Documentation.** Renvoie vers la doc officielle (vuejs.org, pinia.vuejs.org, router.vuejs.org) pour approfondir.
8. **Tailwind** pour tout le style : pas de CSS custom sauf nécessité. Garde les classes lisibles. Quand un groupe de classes se répète, extrais un composant plutôt que d'utiliser `@apply`.
9. Réponds **en français**.

---

## Le projet

Une mini-supervision d'atelier de production avec de la maintenance (une GMAO légère).
Une dizaine de machines (presse, CNC, convoyeur…) remontent de la télémétrie : température, vibrations, cadence, état (marche, arrêt, panne).
L'app permet de :
- voir l'état de l'atelier en temps réel ;
- consulter l'historique d'une machine ;
- gérer les alertes et les ordres de maintenance ;
- **à la fin**, afficher l'atelier dans une **vue 3D isométrique** (inspiration : des dashboards d'entrepôt avec une scène 3D en vue orthographique, des machines low-poly et des étiquettes flottantes).

### Stack

- **Front** : Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Vue Router, Pinia, Tailwind CSS, vue-chartjs (ou ECharts)
- **Back** : Node.js + TypeScript, Fastify, Prisma, PostgreSQL, Zod (validation)
- **Temps réel** : SSE (Server-Sent Events)
- **Simulateur** : un script Node/TS qui génère la télémétrie et provoque des pannes aléatoires (aucune API externe)
- **3D** : TresJS (`@tresjs/core` + `@tresjs/cientos`), qui apporte Three.js sous forme de composants Vue
- **Tests** : Vitest partout (front et back)
- **Infra** : monorepo (pnpm workspaces) + docker-compose (Postgres, API, simulateur)

### Structure du monorepo

```
atelier/
├── apps/
│   ├── web/          # Vue 3 + Vite
│   ├── api/          # Fastify + Prisma
│   └── simulator/    # générateur de télémétrie
├── packages/
│   └── shared/       # types + schémas Zod partagés front/back
├── docker-compose.yml
└── CLAUDE.md
```

### Modèle de données (Prisma)

- `Machine` : id, name, type (`press` | `cnc` | `conveyor`…), line, thresholds (JSON), posX, posZ, rotation (pour la vue 3D)
- `Reading` : id, machineId, timestamp, temperature, vibration, rate, status (index sur `machineId, timestamp`)
- `Alert` : id, machineId, type, value, createdAt, acknowledged
- `WorkOrder` : id, machineId, alertId?, title, priority, status (`todo` | `in_progress` | `done`), assignee, createdAt, closedAt
- `User` : id, name, role (`operator` | `technician` | `manager`)

### Fonctionnalités

**MVP**
1. **Dashboard atelier** : une grille de machines avec un statut coloré et les dernières valeurs, mise à jour en live par SSE.
2. **Fiche machine** : courbes sur 1 h, 24 h et 7 jours (agrégées côté back), seuils affichés, historique des pannes.
3. **Alertes** : quand un seuil est dépassé, l'alerte est créée en base et poussée en direct vers le front.
4. **Ordres de maintenance** : CRUD (création depuis une alerte, assignation, changement de statut), avec filtres synchronisés dans l'URL (query params).

**Bonus**
- KPI industriels : TRS/OEE (disponibilité × performance × qualité), MTBF, MTTR
- Kanban des ordres de maintenance en drag & drop
- Auth JWT et rôles
- **Vue 3D isométrique de l'atelier** (dernière étape)

### Vue 3D isométrique (dernière étape)

- `TresCanvas` + `TresOrthographicCamera` placée en `[20, 20, 20]` pour obtenir la vue isométrique
- Commencer avec des **boîtes colorées** branchées sur les vraies données, puis passer à des modèles `.glb` low-poly (Kenney.nl « Conveyor Kit », Quaternius) chargés avec `useGLTF`
- Ombres douces avec `ContactShadows`, sol blanc cassé, machines grises, **couleur réservée au statut** (vert = marche, orange = alerte, rouge = panne)
- Étiquettes flottantes avec `<Html>` de cientos, stylées en Tailwind
- Pulsation `emissive` sur les machines en alerte ; petites caisses animées sur les convoyeurs avec `useRenderLoop`
- Clic sur une machine → navigation vers sa fiche
- Scène pilotée par la BDD (posX, posZ, rotation, type) et par le flux SSE
- Route chargée en **lazy load** (`() => import('./views/Floor3D.vue')`) ; `InstancedMesh` au-delà d'une cinquantaine d'objets identiques

### Stratégie de tests (légère)

Principe : **tester la logique, pas l'UI**. Viser 15 à 25 tests au total, écrits au fil du dev.
- **Unitaires (fonctions pures)** : calcul des KPI, détection de dépassement de seuil, agrégation des readings, transitions de statut des ordres de maintenance, mapping statut → couleur pour la 3D
- **Intégration API** : 3 ou 4 tests de routes avec `app.inject()` de Fastify, sur une base Postgres de test (pas de mock de Prisma)
- **Composables Vue** : tester `useWorkOrders` et le parsing SSE avec `vi.fn()`, sans monter de composants
- À éviter : snapshots, tests de composants ligne à ligne, couverture à 100 %
- Optionnel : **un seul** test E2E Playwright sur le parcours alerte → ordre de maintenance → terminé
- Tests placés à côté du code (`kpi.ts` et `kpi.test.ts`), `vitest --watch` en dev, GitHub Action avec `vitest run`

---

## Plan pas à pas (chaque étape = une leçon Vue)

| # | Étape | Concepts Vue à réviser |
|---|-------|------------------------|
| 0 | Setup monorepo, Vite + Vue + TS + Tailwind, docker-compose Postgres | Anatomie d'un SFC (`.vue`), `<script setup>`, `createApp` |
| 1 | Back minimal : schéma Prisma, seed, simulateur, `GET /machines` *(explications plus courtes, le focus est sur Vue)* | — (bases de Fastify et Prisma) |
| 2 | Premier composant `MachineCard` avec des données en dur | Template syntax, `v-bind`, `v-if` / `v-show`, `v-for` + `key`, classes dynamiques |
| 3 | Props et events : `MachineGrid` → `MachineCard` | `defineProps`, `defineEmits`, typage TS des props, flux de données unidirectionnel |
| 4 | Réactivité : état local, filtres et tri de la grille | `ref`, `reactive`, `computed`, `watch` / `watchEffect`, pièges de réactivité |
| 5 | Appeler l'API : client typé + premier composable `useMachines` | Composables, cycle de vie (`onMounted`, `onUnmounted`), états loading / error |
| 6 | Vue Router : dashboard, fiche machine `/machines/:id`, ordres de maintenance | Routes, params, `useRoute` / `useRouter`, lazy loading, navigation guards |
| 7 | Temps réel : endpoint SSE + composable `useMachineStream` | Effets de bord, nettoyage, reconnexion |
| 8 | Pinia : store des machines (état live partagé) et des alertes | `defineStore` (setup store), `storeToRefs`, quand utiliser un store ou pas |
| 9 | Fiche machine : graphes + agrégation côté back | Intégration d'une lib tierce, `watch` sur les params de route |
| 10 | Ordres de maintenance : formulaire + CRUD + filtres dans l'URL | `v-model` (y compris sur les composants avec `defineModel`), validation avec Zod partagé |
| 11 | Composants réutilisables : `Modal`, `Badge`, `DataTable` | Slots (par défaut, nommés, scoped), `provide` / `inject`, `Teleport` |
| 12 | Tests | Vitest, tests de fonctions pures et de composables, `app.inject()` |
| 13 | Bonus : KPI TRS / MTBF / MTTR, kanban | `TransitionGroup`, drag & drop |
| 14 | Vue 3D isométrique avec TresJS | Composants « renderless », intégration Three.js, `useRenderLoop` |
| 15 | Polish : README (choix d'archi), déploiement, CI | — |

**Pour commencer : lance l'étape 0.** Présente-moi rapidement le plan, puis fais le setup en m'expliquant chaque fichier.

---

## Vocabulaire

Le vocabulaire du domaine (Machine, Reading, Status vs Health, Alert, WorkOrder…) est défini dans `GLOSSARY.md`. Utilise ces termes dans le code et dans les explications.
