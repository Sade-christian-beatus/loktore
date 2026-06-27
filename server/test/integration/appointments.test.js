/**
 * Tests d'intégration — routes RDV (/appointments/*)
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { patchPrisma, startTestServer } from '../helpers/prisma-mock.js'
import { signAccessToken } from '../../src/utils/jwt.js'

let server
const patientToken = signAccessToken({ id: 'patient-1', email: 'p@test.bf', role: 'patient' })
const doctorToken = signAccessToken({ id: 'doctor-1', email: 'd@test.bf', role: 'doctor' })

const futureDate = new Date(Date.now() + 86400_000).toISOString()

before(async () => {
  server = await startTestServer()
})

after(async () => {
  await server.close()
})

// --- GET /appointments -----------------------------------------------------

test('GET /appointments : 401 sans token', async () => {
  const { status } = await server.api('GET', '/appointments')
  assert.equal(status, 401)
})

test('GET /appointments : liste les RDV du patient authentifié', async () => {
  const restore = patchPrisma({
    appointment: {
      findMany: async ({ where }) => {
        assert.equal(where.patientId, 'patient-1')
        return [
          { id: 'appt-1', patientId: 'patient-1', doctorId: 'doctor-1', scheduledAt: futureDate, status: 'pending', doctor: { fullName: 'Dr Kaboré' }, patient: { fullName: 'Patient Test' } },
        ]
      },
    },
  })

  const { status, body } = await server.api('GET', '/appointments', null, patientToken)

  restore()
  assert.equal(status, 200)
  assert.equal(body.length, 1)
  assert.equal(body[0].id, 'appt-1')
})

test('GET /appointments : liste les RDV du médecin authentifié', async () => {
  const restore = patchPrisma({
    appointment: {
      findMany: async ({ where }) => {
        assert.equal(where.doctorId, 'doctor-1')
        return []
      },
    },
  })

  const { status, body } = await server.api('GET', '/appointments', null, doctorToken)

  restore()
  assert.equal(status, 200)
  assert.deepEqual(body, [])
})

// --- POST /appointments ----------------------------------------------------

test('POST /appointments : 201 réservation valide', async () => {
  const restore = patchPrisma({
    profile: {
      findUnique: async () => ({ id: 'doctor-1', role: 'doctor' }),
    },
    appointment: {
      findFirst: async () => null,
      create: async ({ data }) => ({ id: 'appt-new', status: 'pending', ...data }),
    },
  })

  const { status, body } = await server.api(
    'POST',
    '/appointments',
    { doctorId: 'doctor-1', scheduledAt: futureDate, reason: 'Consultation générale' },
    patientToken,
  )

  restore()
  assert.equal(status, 201)
  assert.equal(body.status, 'pending')
  assert.equal(body.patientId, 'patient-1')
})

test('POST /appointments : 409 si créneau déjà pris', async () => {
  const restore = patchPrisma({
    profile: {
      findUnique: async () => ({ id: 'doctor-1', role: 'doctor' }),
    },
    appointment: {
      findFirst: async () => ({ id: 'existing', status: 'confirmed' }),
    },
  })

  const { status, body } = await server.api(
    'POST',
    '/appointments',
    { doctorId: 'doctor-1', scheduledAt: futureDate },
    patientToken,
  )

  restore()
  assert.equal(status, 409)
  assert.match(body.message, /déjà réservé/)
})

test('POST /appointments : 400 si doctorId invalide (non-UUID)', async () => {
  const { status } = await server.api(
    'POST',
    '/appointments',
    { doctorId: 'pas-un-uuid', scheduledAt: futureDate },
    patientToken,
  )
  assert.equal(status, 400)
})

test('POST /appointments : 403 si médecin tente de créer un RDV', async () => {
  const { status } = await server.api(
    'POST',
    '/appointments',
    { doctorId: 'patient-1', scheduledAt: futureDate },
    doctorToken,
  )
  assert.equal(status, 403)
})

test('POST /appointments : 400 si doctorId ne correspond pas à un médecin', async () => {
  const restore = patchPrisma({
    profile: {
      findUnique: async () => ({ id: 'patient-1', role: 'patient' }),
    },
    appointment: {
      findFirst: async () => null,
    },
  })

  const { status, body } = await server.api(
    'POST',
    '/appointments',
    { doctorId: '00000000-0000-0000-0000-000000000001', scheduledAt: futureDate },
    patientToken,
  )

  restore()
  assert.equal(status, 400)
  assert.match(body.message, /Médecin introuvable/)
})

// --- PATCH /appointments/:id -----------------------------------------------

test('PATCH /appointments/:id : patient peut annuler son RDV', async () => {
  const restore = patchPrisma({
    appointment: {
      findUnique: async () => ({ id: 'appt-1', patientId: 'patient-1', doctorId: 'doctor-1', status: 'pending' }),
      update: async ({ data }) => ({ id: 'appt-1', ...data }),
    },
  })

  const { status, body } = await server.api('PATCH', '/appointments/appt-1', { status: 'cancelled' }, patientToken)

  restore()
  assert.equal(status, 200)
  assert.equal(body.status, 'cancelled')
})

test('PATCH /appointments/:id : 403 si tiers non concerné', async () => {
  const otherToken = signAccessToken({ id: 'other-99', email: 'other@test.bf', role: 'patient' })

  const restore = patchPrisma({
    appointment: {
      findUnique: async () => ({ id: 'appt-1', patientId: 'patient-1', doctorId: 'doctor-1', status: 'pending' }),
    },
  })

  const { status } = await server.api('PATCH', '/appointments/appt-1', { status: 'cancelled' }, otherToken)

  restore()
  assert.equal(status, 403)
})

test('PATCH /appointments/:id : 404 si RDV inexistant', async () => {
  const restore = patchPrisma({
    appointment: {
      findUnique: async () => null,
    },
  })

  const { status } = await server.api('PATCH', '/appointments/ghost-id', { status: 'cancelled' }, patientToken)

  restore()
  assert.equal(status, 404)
})
