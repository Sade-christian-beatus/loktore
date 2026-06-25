// Données de démonstration (Phase 1) — aucune donnée réelle de patient.
// Servent à montrer les écrans avant le branchement au backend.

// Accès rapides de l'accueil (cf. maquette : Hôpital, Pharmacie, Covid 19, Ambulance)
export const quickAccess = [
  { key: 'hospital', icon: '🏥' },
  { key: 'pharmacy', icon: '💊' },
  { key: 'covid', icon: '🦠' },
  { key: 'ambulance', icon: '🚑' },
]

export const doctors = [
  {
    id: 'd1',
    title: 'Dr',
    fullName: 'César KABORE',
    speciality: 'dentistry',
    facility: 'Clinique Sandof, Ouagadougou',
    isOnline: true,
    fee: 6000,
    rating: 4.7,
  },
  {
    id: 'd2',
    title: 'Pr',
    fullName: 'Fatim NANA',
    speciality: 'gynecology',
    facility: 'CHU Yalgado, Ouagadougou',
    isOnline: true,
    fee: 8000,
    rating: 4.9,
  },
  {
    id: 'd3',
    title: 'Dr',
    fullName: 'Bertrand KAFANDO',
    speciality: 'surgery',
    facility: 'Hôpital Tengandogo, Ouagadougou',
    isOnline: true,
    fee: 10000,
    rating: 4.8,
  },
  {
    id: 'd4',
    title: 'Dr',
    fullName: 'Aminata OUÉDRAOGO',
    speciality: 'general',
    facility: 'CHR Bobo-Dioulasso',
    isOnline: false,
    fee: 5000,
    rating: 4.6,
  },
]

// Astuces & Conseils Santé (cf. maquette : grille 2×2)
export const healthTopics = [
  { key: 'nutrition', icon: '🥗' },
  { key: 'hygiene', icon: '🧼' },
  { key: 'sexualHealth', icon: '⚧' },
  { key: 'moreCategories', icon: '➕' },
]

// Pharmacies de garde (cf. maquette : nom + téléphone)
export const pharmacies = [
  {
    id: 'p1',
    name: 'Pharmacie Coura',
    phone: '25 00 00 00',
    type: 'pharmacy',
    address: 'Avenue Kwame Nkrumah, Ouagadougou',
    onDuty: true,
    distanceKm: 1.2,
    lat: 12.3686,
    lng: -1.5275,
  },
  {
    id: 'p2',
    name: 'Pharmacie Maré',
    phone: '25 00 00 01',
    type: 'pharmacy',
    address: 'Secteur 15, Ouagadougou',
    onDuty: true,
    distanceKm: 2.8,
    lat: 12.3914,
    lng: -1.5072,
  },
  {
    id: 'p3',
    name: 'Pharmacie Kwasar',
    phone: '25 00 00 02',
    type: 'pharmacy',
    address: 'Secteur 22, Ouagadougou',
    onDuty: true,
    distanceKm: 3.5,
    lat: 12.401,
    lng: -1.49,
  },
]

export const facilities = [
  {
    id: 'f1',
    name: 'CHU Yalgado Ouédraogo',
    type: 'hospital',
    address: 'Ouagadougou',
    lat: 12.3656,
    lng: -1.5198,
  },
  {
    id: 'f2',
    name: 'Hôpital de district de Bogodogo',
    type: 'hospital',
    address: 'Ouagadougou',
    lat: 12.3289,
    lng: -1.4894,
  },
]
