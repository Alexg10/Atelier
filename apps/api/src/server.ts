import { buildApp } from './app.ts'

const app = await buildApp()

const port = Number(process.env.API_PORT ?? 3001)
await app.listen({ port, host: '0.0.0.0' })
