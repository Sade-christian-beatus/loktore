/**
 * Helper de mock Prisma pour les tests d'intégration.
 *
 * Fonctionne grâce au singleton ESM : tous les modules partagent
 * la même instance de PrismaClient. Remplacer ses méthodes avant
 * chaque test suffit pour intercepter les appels DB.
 *
 * Usage :
 *   const restore = patchPrisma({ profile: { findUnique: async () => null } })
 *   // ... test ...
 *   restore()
 */
import { prisma } from '../../src/lib/prisma.js'

export function patchPrisma(overrides) {
  const originals = {}
  for (const [model, methods] of Object.entries(overrides)) {
    originals[model] = {}
    for (const [method, impl] of Object.entries(methods)) {
      originals[model][method] = prisma[model][method]
      prisma[model][method] = impl
    }
  }
  return function restore() {
    for (const [model, methods] of Object.entries(originals)) {
      for (const [method, impl] of Object.entries(methods)) {
        prisma[model][method] = impl
      }
    }
  }
}

/**
 * Lance un serveur Express sur un port aléatoire et renvoie son URL de base.
 * Utilise fetch() natif (Node 18+) pour les requêtes HTTP.
 */
import http from 'node:http'
import { createApp } from '../../src/app.js'

export async function startTestServer() {
  const app = createApp()
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const baseUrl = `http://127.0.0.1:${port}/api/v1`

  async function api(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => null)
    return { status: res.status, body: json }
  }

  return {
    api,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}
