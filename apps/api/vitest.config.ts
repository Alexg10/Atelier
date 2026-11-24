import { defineConfig } from 'vitest/config'

// Une base dédiée aux tests, sur le Postgres de docker-compose : les tests la vident sans toucher aux données de dev.
// En CI, on la remplace par la variable TEST_DATABASE_URL.
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? 'postgresql://atelier:atelier@localhost:5433/atelier_test'

export default defineConfig({
  test: {
    // Défini avant le chargement de db.ts : dotenv ne remplace pas une variable déjà présente.
    env: { DATABASE_URL: testDatabaseUrl },
    // Exécuté une fois avant tous les tests de l'API : applique les migrations sur la base de test.
    globalSetup: ['./test/globalSetup.ts'],
  },
})
