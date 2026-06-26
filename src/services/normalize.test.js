import { test, expect } from 'vitest'
import { normalizeDoctor, normalizeFacility } from './normalize.js'

test('normalizeDoctor mappe la forme API vers la forme UI', () => {
  const api = {
    id: 'd1',
    speciality: 'general',
    isOnline: true,
    consultationFee: 5000,
    profile: { fullName: 'Dr Aminata Ouédraogo' },
    facility: { name: 'CHU Yalgado' },
  }
  const ui = normalizeDoctor(api)
  expect(ui).toMatchObject({
    id: 'd1',
    title: 'Dr',
    fullName: 'Dr Aminata Ouédraogo',
    speciality: 'general',
    facility: 'CHU Yalgado',
    isOnline: true,
    fee: 5000,
  })
})

test('normalizeDoctor applique des valeurs par défaut robustes', () => {
  const ui = normalizeDoctor({ id: 'x', speciality: 'pediatrics' })
  expect(ui.title).toBe('Dr')
  expect(ui.fullName).toBe('')
  expect(ui.isOnline).toBe(false)
  expect(ui.fee).toBe(0)
})

test('normalizeFacility convertit latitude/longitude en lat/lng', () => {
  const ui = normalizeFacility({
    id: 'f1',
    name: 'Pharmacie Wend-Panga',
    type: 'pharmacy',
    latitude: 12.36,
    longitude: -1.52,
    onDuty: true,
  })
  expect(ui).toMatchObject({ lat: 12.36, lng: -1.52, onDuty: true, type: 'pharmacy' })
  expect(ui.address).toBe('')
})
