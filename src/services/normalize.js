// Normalisation des réponses API vers la forme attendue par l'UI.
// Module pur (sans effet de bord) — facilement testable.

export function normalizeDoctor(d) {
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

export function normalizeFacility(f) {
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
