/**
 * Tests d'intégration — messagerie (/conversations/*)
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { patchPrisma, startTestServer } from '../helpers/prisma-mock.js'
import { signAccessToken } from '../../src/utils/jwt.js'

let server
const patientToken = signAccessToken({ id: 'patient-1', email: 'p@test.bf', role: 'patient' })
const doctorToken = signAccessToken({ id: 'doctor-1', email: 'd@test.bf', role: 'doctor' })

before(async () => {
  server = await startTestServer()
})

after(async () => {
  await server.close()
})

// --- GET /conversations ----------------------------------------------------

test('GET /conversations : 401 sans token', async () => {
  const { status } = await server.api('GET', '/conversations')
  assert.equal(status, 401)
})

test('GET /conversations : liste les conversations du patient', async () => {
  const restore = patchPrisma({
    conversation: {
      findMany: async ({ where }) => {
        assert.ok(where.OR.some((c) => c.patientId === 'patient-1'))
        return [
          {
            id: 'conv-1',
            patientId: 'patient-1',
            doctorId: 'doctor-1',
            updatedAt: new Date(),
            patient: { id: 'patient-1', fullName: 'Patient Test' },
            doctor: { id: 'doctor-1', fullName: 'Dr Kaboré' },
          },
        ]
      },
    },
    message: {
      findFirst: async () => ({ id: 'msg-1', content: 'Bonjour', createdAt: new Date() }),
    },
  })

  const { status, body } = await server.api('GET', '/conversations', null, patientToken)

  restore()
  assert.equal(status, 200)
  assert.equal(body.length, 1)
  assert.equal(body[0].id, 'conv-1')
  assert.ok(body[0].lastMessage)
})

// --- POST /conversations ---------------------------------------------------

test('POST /conversations : patient crée une conversation avec un médecin', async () => {
  const restore = patchPrisma({
    profile: {
      findUnique: async () => ({ id: 'doctor-1', role: 'doctor' }),
    },
    conversation: {
      upsert: async ({ create }) => ({ id: 'conv-new', ...create }),
    },
  })

  const { status, body } = await server.api(
    'POST',
    '/conversations',
    { doctorId: 'doctor-1' },
    patientToken,
  )

  restore()
  assert.equal(status, 201)
  assert.equal(body.patientId, 'patient-1')
  assert.equal(body.doctorId, 'doctor-1')
})

test('POST /conversations : 403 si médecin tente de créer une conversation', async () => {
  const { status } = await server.api(
    'POST',
    '/conversations',
    { doctorId: '00000000-0000-0000-0000-000000000001' },
    doctorToken,
  )
  assert.equal(status, 403)
})

test('POST /conversations : 400 si doctorId invalide', async () => {
  const restore = patchPrisma({
    profile: {
      findUnique: async () => ({ id: 'any', role: 'patient' }),
    },
  })

  const { status, body } = await server.api(
    'POST',
    '/conversations',
    { doctorId: '00000000-0000-0000-0000-000000000001' },
    patientToken,
  )

  restore()
  assert.equal(status, 400)
  assert.match(body.message, /Médecin introuvable/)
})

// --- GET /conversations/:id/messages --------------------------------------

test('GET /conversations/:id/messages : liste les messages si membre', async () => {
  const restore = patchPrisma({
    conversation: {
      findUnique: async () => ({ id: 'conv-1', patientId: 'patient-1', doctorId: 'doctor-1' }),
    },
    message: {
      findMany: async () => [
        { id: 'msg-1', content: 'Bonjour', senderId: 'doctor-1', createdAt: new Date() },
        { id: 'msg-2', content: 'Merci', senderId: 'patient-1', createdAt: new Date() },
      ],
    },
  })

  const { status, body } = await server.api('GET', '/conversations/conv-1/messages', null, patientToken)

  restore()
  assert.equal(status, 200)
  assert.equal(body.length, 2)
})

test('GET /conversations/:id/messages : 403 si non-membre', async () => {
  const otherToken = signAccessToken({ id: 'outsider-99', email: 'o@test.bf', role: 'patient' })

  const restore = patchPrisma({
    conversation: {
      findUnique: async () => ({ id: 'conv-1', patientId: 'patient-1', doctorId: 'doctor-1' }),
    },
  })

  const { status } = await server.api('GET', '/conversations/conv-1/messages', null, otherToken)

  restore()
  assert.equal(status, 403)
})

// --- POST /conversations/:id/messages ------------------------------------

test('POST /conversations/:id/messages : envoyer un message', async () => {
  const restore = patchPrisma({
    conversation: {
      findUnique: async () => ({ id: 'conv-1', patientId: 'patient-1', doctorId: 'doctor-1' }),
      update: async () => ({}),
    },
    message: {
      create: async ({ data }) => ({ id: 'msg-new', ...data, createdAt: new Date() }),
    },
    pushSubscription: {
      findMany: async () => [],
    },
  })

  const { status, body } = await server.api(
    'POST',
    '/conversations/conv-1/messages',
    { content: 'Bonjour docteur' },
    patientToken,
  )

  restore()
  assert.equal(status, 201)
  assert.equal(body.content, 'Bonjour docteur')
  assert.equal(body.senderId, 'patient-1')
})

test('POST /conversations/:id/messages : 400 si contenu vide', async () => {
  const restore = patchPrisma({
    conversation: {
      findUnique: async () => ({ id: 'conv-1', patientId: 'patient-1', doctorId: 'doctor-1' }),
    },
  })

  const { status } = await server.api(
    'POST',
    '/conversations/conv-1/messages',
    { content: '' },
    patientToken,
  )

  restore()
  assert.equal(status, 400)
})
