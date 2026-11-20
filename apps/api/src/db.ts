import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.ts'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

// Une seule instance partagée par toute l'API (elle gère le pool de connexions).
export const prisma = new PrismaClient({ adapter })
