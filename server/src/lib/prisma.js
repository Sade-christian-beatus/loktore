import { PrismaClient } from '@prisma/client'

// Instance unique de Prisma réutilisée dans toute l'application.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})
