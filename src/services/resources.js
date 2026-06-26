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

export function updateAppointmentStatus(id, status) {
  return api.patch(`/appointments/${id}`, { status })
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

// --- Messagerie ------------------------------------------------------------

export async function fetchConversations() {
  if (!api.hasToken()) return []
  return api.get('/conversations')
}

export function createConversation(doctorId) {
  return api.post('/conversations', { doctorId })
}

export function fetchMessages(conversationId) {
  return api.get(`/conversations/${conversationId}/messages`)
}

export function sendMessage(conversationId, content) {
  return api.post(`/conversations/${conversationId}/messages`, { content })
}

// --- Commandes (patient ↔ pharmacie) ---------------------------------------

export function fetchFacilityMedications(facilityId) {
  return api.get(`/facilities/${facilityId}/medications`)
}

export function createOrder(payload) {
  return api.post('/orders', payload)
}

export function fetchOrders() {
  return api.get('/orders')
}

export function cancelOrder(id) {
  return api.patch(`/orders/${id}`, { status: 'cancelled' })
}

export function payOrder(orderId, payload) {
  return api.post(`/orders/${orderId}/pay`, payload)
}

export function confirmPayment(paymentId) {
  return api.post(`/payments/${paymentId}/confirm`)
}

export function fetchPharmacyOrders() {
  return api.get('/pharmacy/orders')
}

export function updatePharmacyOrder(id, status) {
  return api.patch(`/pharmacy/orders/${id}`, { status })
}

// --- Consentements (partage du dossier médical) ----------------------------

export function fetchConsents() {
  return api.get('/consents')
}

export function requestConsent(patientId) {
  return api.post('/consents', { patientId })
}

export function decideConsent(id, status) {
  return api.patch(`/consents/${id}`, { status })
}

export function fetchPatientRecord(patientId) {
  return api.get(`/patients/${patientId}/medical-record`)
}

// --- Admin -----------------------------------------------------------------

export function fetchAdminStats() {
  return api.get('/admin/stats')
}

export function fetchAdminUsers() {
  return api.get('/admin/users')
}

// --- Pharmacie -------------------------------------------------------------

export function fetchPharmacyMedications() {
  return api.get('/pharmacy/medications')
}

export function createMedication(payload) {
  return api.post('/pharmacy/medications', payload)
}

export function updateMedication(id, payload) {
  return api.patch(`/pharmacy/medications/${id}`, payload)
}

export function deleteMedication(id) {
  return api.del(`/pharmacy/medications/${id}`)
}

// --- Profil ----------------------------------------------------------------

export async function updateProfile(payload) {
  if (!api.hasToken()) {
    throw new Error('Connectez-vous à un compte réel pour modifier votre profil.')
  }
  const { user } = await api.patch('/auth/me', payload)
  return user
}
