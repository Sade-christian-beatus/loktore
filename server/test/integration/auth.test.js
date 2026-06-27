/**
 * Tests d'intégration — routes d'authentification (/auth/*)
 *
 * Prisma est mocké au niveau du singleton partagé.
 * Aucune base de données réelle n'est nécessaire.
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { patchPrisma, startTestServer } from '../helpers/prisma-mock.js'
import { hashPassword } from '../../src/utils/password.js'
import { signRefreshToken } from '../../src/utils/jwt.js'

let server

before(async () => {
  server = await startTestServer()
})

after(async () => {
  await server.close()
})

// --- POST /auth/register ---------------------------------------------------

test('register : 201 avec données valides', async () => {
  const restore = patchPrisma({
    profile: {
      findUnique: async () => null,
      create: async ({ data }) => ({ id: 'uuid-1', role: 'patient', ...data }),
    },
    refreshToken: {
      create: async () => ({}),
    },
  })

  const { status, body } = await server.api('POST', '/auth/register', {
    email: 'nouveau@test.bf',
    password: 'Secure1!',
    fullName: 'Nouveau Patient',
  })

  restore()
  assert.equal(status, 201)
  assert.ok(body.token)
  assert.equal(body.user.email, 'nouveau@test.bf')
  assert.equal(body.user.role, 'patient')
})

test('register : 409 si email déjà pris', async () => {
  const restore = patchPrisma({
    profile: {
      findUnique: async () => ({ id: 'uuid-existing', email: 'pris@test.bf' }),
    },
  })

  const { status, body } = await server.api('POST', '/auth/register', {
    email: 'pris@test.bf',
    password: 'Secure1!',
    fullName: 'Doublon',
  })

  restore()
  assert.equal(status, 409)
  assert.match(body.message, /déjà utilisé/)
})

test('register : 400 si mot de passe sans majuscule', async () => {
  const { status } = await server.api('POST', '/auth/register', {
    email: 'x@test.bf',
    password: 'nosecret1!',
    fullName: 'Test',
  })
  assert.equal(status, 400)
})

test('register : 400 si mot de passe sans chiffre', async () => {
  const { status } = await server.api('POST', '/auth/register', {
    email: 'x@test.bf',
    password: 'NoDigit!',
    fullName: 'Test',
  })
  assert.equal(status, 400)
})

test('register : 400 si mot de passe sans caractère spécial', async () => {
  const { status } = await server.api('POST', '/auth/register', {
    email: 'x@test.bf',
    password: 'NoSpecial1',
    fullName: 'Test',
  })
  assert.equal(status, 400)
})

test('register : 400 si email invalide', async () => {
  const { status } = await server.api('POST', '/auth/register', {
    email: 'pas-un-email',
    password: 'Secure1!',
    fullName: 'Test',
  })
  assert.equal(status, 400)
})

// --- POST /auth/login ------------------------------------------------------

test('login : 200 avec identifiants valides', async () => {
  const hash = await hashPassword('Secure1!')
  const restore = patchPrisma({
    profile: {
      findUnique: async () => ({
        id: 'uuid-1',
        email: 'patient@test.bf',
        fullName: 'Patient Test',
        role: 'patient',
        preferredLanguage: 'fr',
        passwordHash: hash,
      }),
    },
    refreshToken: {
      create: async () => ({}),
    },
  })

  const { status, body } = await server.api('POST', '/auth/login', {
    email: 'patient@test.bf',
    password: 'Secure1!',
  })

  restore()
  assert.equal(status, 200)
  assert.ok(body.token)
  assert.ok(body.refresh)
  assert.equal(body.user.role, 'patient')
})

test('login : 401 avec mauvais mot de passe', async () => {
  const hash = await hashPassword('Secure1!')
  const restore = patchPrisma({
    profile: {
      findUnique: async () => ({
        id: 'uuid-1',
        email: 'patient@test.bf',
        fullName: 'Patient Test',
        role: 'patient',
        preferredLanguage: 'fr',
        passwordHash: hash,
      }),
    },
  })

  const { status } = await server.api('POST', '/auth/login', {
    email: 'patient@test.bf',
    password: 'WrongPass1!',
  })

  restore()
  assert.equal(status, 401)
})

test('login : 401 si utilisateur inexistant', async () => {
  const restore = patchPrisma({
    profile: { findUnique: async () => null },
  })

  const { status } = await server.api('POST', '/auth/login', {
    email: 'fantome@test.bf',
    password: 'Secure1!',
  })

  restore()
  assert.equal(status, 401)
})

// --- POST /auth/refresh ----------------------------------------------------

test('refresh : rotation du token réussie', async () => {
  const profile = { id: 'uuid-1', email: 'p@test.bf', fullName: 'P', role: 'patient', preferredLanguage: 'fr' }
  const refreshToken = signRefreshToken(profile)

  const restore = patchPrisma({
    refreshToken: {
      findUnique: async () => ({ token: refreshToken, revokedAt: null }),
      update: async () => ({}),
      create: async () => ({}),
    },
    profile: {
      findUnique: async () => profile,
    },
  })

  const { status, body } = await server.api('POST', '/auth/refresh', { refresh: refreshToken })

  restore()
  assert.equal(status, 200)
  assert.ok(body.token)
  assert.ok(body.refresh)
})

test('refresh : 401 si token révoqué', async () => {
  const profile = { id: 'uuid-1', email: 'p@test.bf', role: 'patient' }
  const refreshToken = signRefreshToken(profile)

  const restore = patchPrisma({
    refreshToken: {
      findUnique: async () => ({ token: refreshToken, revokedAt: new Date() }),
    },
  })

  const { status } = await server.api('POST', '/auth/refresh', { refresh: refreshToken })

  restore()
  assert.equal(status, 401)
})

// --- GET /auth/me ----------------------------------------------------------

test('GET /auth/me : 401 sans token', async () => {
  const { status } = await server.api('GET', '/auth/me', null, null)
  assert.equal(status, 401)
})

test('GET /auth/me : 200 avec token valide', async () => {
  const { signAccessToken } = await import('../../src/utils/jwt.js')
  const profile = { id: 'uuid-1', email: 'p@test.bf', role: 'patient', preferredLanguage: 'fr', fullName: 'P Test' }
  const token = signAccessToken(profile)

  const restore = patchPrisma({
    profile: { findUnique: async () => profile },
  })

  const { status, body } = await server.api('GET', '/auth/me', null, token)

  restore()
  assert.equal(status, 200)
  assert.equal(body.user.email, 'p@test.bf')
})

// --- POST /auth/logout -----------------------------------------------------

test('logout : 204 et révocation du refresh token', async () => {
  const { signAccessToken } = await import('../../src/utils/jwt.js')
  const profile = { id: 'uuid-1', email: 'p@test.bf', role: 'patient' }
  const token = signAccessToken(profile)
  const refreshToken = signRefreshToken(profile)

  let revokedToken = null
  const restore = patchPrisma({
    refreshToken: {
      updateMany: async ({ where }) => {
        revokedToken = where.token
        return { count: 1 }
      },
    },
  })

  const { status } = await server.api('POST', '/auth/logout', { refresh: refreshToken }, token)

  restore()
  assert.equal(status, 204)
  assert.equal(revokedToken, refreshToken)
})
