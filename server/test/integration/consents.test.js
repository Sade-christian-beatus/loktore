/**
 * Tests d'intégration — consentements médicaux (/consents/*)
 */
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { patchPrisma, startTestServer } from '../helpers/prisma-mock.js'
import { signAccessToken } from '../../src/utils/jwt.js'

let server
// UUIDs valides requis par la validation Zod
const PATIENT_ID = '11111111-1111-1111-1111-111111111111'
const DOCTOR_ID  = '22222222-2222-2222-2222-222222222222'
const OTHER_ID   = '33333333-3333-3333-3333-333333333333'

const patientToken = signAccessToken({ id: PATIENT_ID, email: 'p@test.bf', role: 'patient' })
const doctorToken  = signAccessToken({ id: DOCTOR_ID,  email: 'd@test.bf', role: 'doctor' })
const otherToken   = signAccessToken({ id: OTHER_ID,   email: 'o@test.bf', role: 'patient' })

before(async () => {
  server = await startTestServer()
})

after(async () => {
  await server.close()
})

// --- GET /consents ---------------------------------------------------------

test('GET /consents : 401 sans token', async () => {
  const { status } = await server.api('GET', '/consents')
  assert.equal(status, 401)
})

test('GET /consents : patient voit ses consentements', async () => {
  const restore = patchPrisma({
    recordConsent: {
      findMany: async ({ where }) => {
        assert.equal(where.patientId, PATIENT_ID)
        return [
          { id: 'c1', patientId: PATIENT_ID, doctorId: DOCTOR_ID, status: 'pending', doctor: { id: DOCTOR_ID, fullName: 'Dr Kaboré' } },
        ]
      },
    },
  })

  const { status, body } = await server.api('GET', '/consents', null, patientToken)
  restore()
  assert.equal(status, 200)
  assert.equal(body.length, 1)
  assert.equal(body[0].status, 'pending')
})

test('GET /consents : médecin voit ses propres demandes', async () => {
  const restore = patchPrisma({
    recordConsent: {
      findMany: async ({ where }) => {
        assert.equal(where.doctorId, DOCTOR_ID)
        return []
      },
    },
  })

  const { status, body } = await server.api('GET', '/consents', null, doctorToken)
  restore()
  assert.equal(status, 200)
  assert.deepEqual(body, [])
})

// --- POST /consents (médecin demande l'accès) --------------------------------

test('POST /consents : médecin crée une nouvelle demande', async () => {
  const restore = patchPrisma({
    profile: {
      findUnique: async () => ({ id: PATIENT_ID, role: 'patient' }),
    },
    recordConsent: {
      findUnique: async () => null,
      create: async ({ data }) => ({ id: 'c-new', ...data }),
    },
  })

  const { status, body } = await server.api('POST', '/consents', { patientId: PATIENT_ID }, doctorToken)
  restore()
  assert.equal(status, 201)
  assert.equal(body.status, 'pending')
  assert.equal(body.doctorId, DOCTOR_ID)
})

test('POST /consents : demande existante retournée si déjà pending', async () => {
  const existing = { id: 'c-exist', patientId: PATIENT_ID, doctorId: DOCTOR_ID, status: 'pending' }
  const restore = patchPrisma({
    profile: {
      findUnique: async () => ({ id: PATIENT_ID, role: 'patient' }),
    },
    recordConsent: {
      findUnique: async () => existing,
    },
  })

  const { status, body } = await server.api('POST', '/consents', { patientId: PATIENT_ID }, doctorToken)
  restore()
  assert.equal(status, 201)
  assert.equal(body.id, 'c-exist')
})

test('POST /consents : 403 si patient essaie de créer une demande', async () => {
  const { status } = await server.api('POST', '/consents', { patientId: OTHER_ID }, patientToken)
  assert.equal(status, 403)
})

test('POST /consents : 400 si patientId invalide (non-UUID)', async () => {
  const { status } = await server.api('POST', '/consents', { patientId: 'pas-un-uuid' }, doctorToken)
  assert.equal(status, 400)
})

// --- PATCH /consents/:id (patient accorde/révoque) -------------------------

test('PATCH /consents/:id : patient accorde le consentement', async () => {
  const restore = patchPrisma({
    recordConsent: {
      findUnique: async () => ({ id: 'c1', patientId: PATIENT_ID, doctorId: DOCTOR_ID, status: 'pending' }),
      update: async ({ data }) => ({ id: 'c1', patientId: PATIENT_ID, doctorId: DOCTOR_ID, ...data }),
    },
  })

  const { status, body } = await server.api('PATCH', '/consents/c1', { status: 'granted' }, patientToken)
  restore()
  assert.equal(status, 200)
  assert.equal(body.status, 'granted')
})

test('PATCH /consents/:id : patient révoque le consentement', async () => {
  const restore = patchPrisma({
    recordConsent: {
      findUnique: async () => ({ id: 'c1', patientId: PATIENT_ID, doctorId: DOCTOR_ID, status: 'granted' }),
      update: async ({ data }) => ({ id: 'c1', patientId: PATIENT_ID, doctorId: DOCTOR_ID, ...data }),
    },
  })

  const { status, body } = await server.api('PATCH', '/consents/c1', { status: 'revoked' }, patientToken)
  restore()
  assert.equal(status, 200)
  assert.equal(body.status, 'revoked')
})

test('PATCH /consents/:id : 404 si autre patient tente de modifier (sécurité)', async () => {
  const restore = patchPrisma({
    recordConsent: {
      findUnique: async () => ({ id: 'c1', patientId: PATIENT_ID, doctorId: DOCTOR_ID, status: 'pending' }),
    },
  })

  // La route retourne 404 (non-divulgation) plutôt que 403 pour les non-propriétaires
  const { status } = await server.api('PATCH', '/consents/c1', { status: 'granted' }, otherToken)
  restore()
  assert.equal(status, 404)
})

test('PATCH /consents/:id : 404 si consentement inexistant', async () => {
  const restore = patchPrisma({
    recordConsent: {
      findUnique: async () => null,
    },
  })

  const { status } = await server.api('PATCH', '/consents/ghost', { status: 'granted' }, patientToken)
  restore()
  assert.equal(status, 404)
})

test('PATCH /consents/:id : 403 si médecin tente de modifier (rôle patient requis)', async () => {
  const { status } = await server.api('PATCH', '/consents/c1', { status: 'granted' }, doctorToken)
  assert.equal(status, 403)
})
