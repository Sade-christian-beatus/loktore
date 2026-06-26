import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeProvider, initiatePayment, confirmPayment } from '../src/lib/payments.js'

test('normalizeProvider accepte les fournisseurs connus, sinon mock', () => {
  assert.equal(normalizeProvider('orange'), 'orange')
  assert.equal(normalizeProvider('moov'), 'moov')
  assert.equal(normalizeProvider('inconnu'), 'mock')
  assert.equal(normalizeProvider(undefined), 'mock')
})

test('initiatePayment renvoie une référence et le statut processing', () => {
  const r = initiatePayment({ provider: 'orange', phone: '70000000', amount: 4500 })
  assert.equal(r.status, 'processing')
  assert.match(r.reference, /^MM-/)
})

test('confirmPayment renvoie le statut succeeded', () => {
  assert.equal(confirmPayment('MM-ABC').status, 'succeeded')
})
