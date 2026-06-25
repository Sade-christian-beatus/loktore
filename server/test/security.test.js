import { test } from 'node:test'
import assert from 'node:assert/strict'

import { hashPassword, verifyPassword } from '../src/utils/password.js'
import { encrypt, decrypt } from '../src/utils/crypto.js'
import { signAccessToken, verifyAccessToken, signRefreshToken } from '../src/utils/jwt.js'
import { requireAuth, requireRole, assertOwnership } from '../src/middleware/auth.js'

// --- Helpers de simulation Express ---------------------------------------

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

const sampleProfile = {
  id: '11111111-1111-1111-1111-111111111111',
  role: 'patient',
  email: 'a@b.bf',
}

// --- Mots de passe ---------------------------------------------------------

test('hashPassword produit un hash différent du clair et vérifiable', async () => {
  const hash = await hashPassword('password123')
  assert.notEqual(hash, 'password123')
  assert.equal(await verifyPassword('password123', hash), true)
  assert.equal(await verifyPassword('mauvais', hash), false)
})

// --- Chiffrement au repos --------------------------------------------------

test('encrypt/decrypt : aller-retour, ciphertext différent du clair', () => {
  const clear = 'O+ allergie pénicilline'
  const enc = encrypt(clear)
  assert.notEqual(enc, clear)
  assert.match(enc, /^enc:v1:/)
  assert.equal(decrypt(enc), clear)
})

test('decrypt tolère les données legacy non chiffrées', () => {
  assert.equal(decrypt('valeur-en-clair'), 'valeur-en-clair')
  assert.equal(decrypt(null), null)
})

// --- JWT -------------------------------------------------------------------

test('signAccessToken / verifyAccessToken : aller-retour', () => {
  const token = signAccessToken(sampleProfile)
  const payload = verifyAccessToken(token)
  assert.equal(payload.sub, sampleProfile.id)
  assert.equal(payload.role, 'patient')
})

test('verifyAccessToken rejette un jeton falsifié', () => {
  const token = signAccessToken(sampleProfile)
  const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'bb' : 'aa')
  assert.throws(() => verifyAccessToken(tampered))
})

test('un refresh token n’est pas valide comme access token', () => {
  const refresh = signRefreshToken(sampleProfile)
  assert.throws(() => verifyAccessToken(refresh))
})

// --- requireAuth -----------------------------------------------------------

test('requireAuth refuse sans en-tête Authorization (401)', () => {
  const req = { headers: {} }
  const res = mockRes()
  let nextCalled = false
  requireAuth(req, res, () => (nextCalled = true))
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 401)
})

test('requireAuth accepte un jeton valide et renseigne req.user', () => {
  const token = signAccessToken(sampleProfile)
  const req = { headers: { authorization: `Bearer ${token}` } }
  const res = mockRes()
  let nextCalled = false
  requireAuth(req, res, () => (nextCalled = true))
  assert.equal(nextCalled, true)
  assert.equal(req.user.id, sampleProfile.id)
  assert.equal(req.user.role, 'patient')
})

// --- requireRole -----------------------------------------------------------

test('requireRole laisse passer le bon rôle et bloque les autres (403)', () => {
  const guard = requireRole('patient')

  const okReq = { user: { role: 'patient' } }
  const okRes = mockRes()
  let okNext = false
  guard(okReq, okRes, () => (okNext = true))
  assert.equal(okNext, true)

  const koReq = { user: { role: 'doctor' } }
  const koRes = mockRes()
  let koNext = false
  guard(koReq, koRes, () => (koNext = true))
  assert.equal(koNext, false)
  assert.equal(koRes.statusCode, 403)
})

// --- assertOwnership -------------------------------------------------------

test('assertOwnership : autorise le propriétaire, refuse les autres', () => {
  const req = { user: { id: 'owner-1' } }
  assert.doesNotThrow(() => assertOwnership(req, 'owner-1'))
  assert.throws(() => assertOwnership(req, 'autre'), (e) => e.status === 403)
})
