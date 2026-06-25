// Couche d'accès aux ressources métier.
// Stratégie : si une session API réelle existe (jeton présent), on interroge
// le backend et on normalise la réponse vers la forme attendue par l'UI ;
// sinon (mode démo / backend indisponible), on sert les données locales.
// Tout échec réseau retombe aussi sur le repli démo : l'app reste utilisable.

import { api } from './api.js'
import {
  doctors as demoDoctors,
  pharmacies as demoPharmacies,
  facilities as demoFacilities,
} from '../data/demo.js'

// --- Normalisation API -> UI ---------------------------------------------

function normalizeDoctor(d) {
  return {
    id: d.id,
    title: d.title || 'Dr',
    fullName: d.profile?.fullName || d.fullName || '',
    speciality: d.speciality,
    facility: d.facility?.name || d.facility || '',
    isOnline: Boolean(d.isOnline),
    fee: d.consultationFee ?? d.fee ?? 0,
    rating: d.rating,
  }
}

function normalizeFacility(f) {
  return {
    id: f.id,
    name: f.name,
    type: f.type,
    address: f.address || '',
    phone: f.phone || '',
    onDuty: Boolean(f.onDuty),
    lat: f.latitude ?? f.lat,
    lng: f.longitude ?? f.lng,
    distanceKm: f.distanceKm,
  }
}

// --- Médecins --------------------------------------------------------------

export async function fetchDoctors(params = {}) {
  if (api.hasToken()) {
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')),
      ).toString()
      const data = await api.get(`/doctors${qs ? `?${qs}` : ''}`)
      return data.map(normalizeDoctor)
    } catch {
      // bascule sur le repli ci-dessous
    }
  }
  let list = demoDoctors
  if (params.online) list = list.filter((d) => d.isOnline)
  if (params.speciality) list = list.filter((d) => d.speciality === params.speciality)
  return list
}

// --- Structures de santé (hôpitaux + pharmacies) ---------------------------

export async function fetchFacilities(params = {}) {
  if (api.hasToken()) {
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')),
      ).toString()
      const data = await api.get(`/facilities${qs ? `?${qs}` : ''}`)
      return data.map(normalizeFacility)
    } catch {
      // repli
    }
  }
  let list = [...demoFacilities, ...demoPharmacies].map(normalizeFacility)
  if (params.type) list = list.filter((f) => f.type === params.type)
  if (params.onDuty) list = list.filter((f) => f.onDuty)
  return list
}

export async function fetchOnDutyPharmacies() {
  const list = await fetchFacilities({ type: 'pharmacy', onDuty: true })
  // Garantit les champs affichés (téléphone) même sur données réelles partielles.
  return list
}

// --- Rendez-vous -----------------------------------------------------------

export async function fetchAppointments(params = {}) {
  if (!api.hasToken()) return []
  const qs = new URLSearchParams(params).toString()
  return api.get(`/appointments${qs ? `?${qs}` : ''}`)
}

export async function createAppointment({ doctorId, scheduledAt, reason }) {
  // Nécessite une session réelle : le backend valide le doctorId (uuid).
  if (!api.hasToken()) {
    throw new Error('Connectez-vous à un compte réel pour réserver un rendez-vous.')
  }
  return api.post('/appointments', { doctorId, scheduledAt, reason })
}

// --- Dossier médical -------------------------------------------------------

export async function fetchMedicalRecord() {
  if (!api.hasToken()) return null
  return api.get('/me/medical-record')
}

export async function updateMedicalRecord(payload) {
  if (!api.hasToken()) {
    throw new Error('Connectez-vous à un compte réel pour modifier votre dossier.')
  }
  return api.put('/me/medical-record', payload)
}
