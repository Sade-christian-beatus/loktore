// Données de démonstration (Phase 1) — aucune donnée réelle de patient.
// Servent à montrer les écrans avant le branchement au backend.

export const categories = [
  { key: 'general', icon: '🩺' },
  { key: 'pediatrics', icon: '👶' },
  { key: 'gynecology', icon: '🌸' },
  { key: 'cardiology', icon: '❤️' },
  { key: 'dentistry', icon: '🦷' },
  { key: 'dermatology', icon: '🧴' },
]

export const doctors = [
  {
    id: 'd1',
    fullName: 'Dr Aminata Ouédraogo',
    speciality: 'general',
    facility: 'CHU Yalgado, Ouagadougou',
    isOnline: true,
    fee: 5000,
    rating: 4.8,
  },
  {
    id: 'd2',
    fullName: 'Dr Boukary Sawadogo',
    speciality: 'pediatrics',
    facility: 'Clinique Sandof, Ouagadougou',
    isOnline: true,
    fee: 7000,
    rating: 4.6,
  },
  {
    id: 'd3',
    fullName: 'Dr Fatoumata Traoré',
    speciality: 'gynecology',
    facility: 'CHR Bobo-Dioulasso',
    isOnline: false,
    fee: 8000,
    rating: 4.9,
  },
  {
    id: 'd4',
    fullName: 'Dr Issa Kaboré',
    speciality: 'cardiology',
    facility: 'Hôpital Tengandogo, Ouagadougou',
    isOnline: false,
    fee: 10000,
    rating: 4.7,
  },
]

export const pharmacies = [
  {
    id: 'p1',
    name: 'Pharmacie Wend-Panga',
    type: 'pharmacy',
    address: 'Avenue Kwame Nkrumah, Ouagadougou',
    onDuty: true,
    distanceKm: 1.2,
    lat: 12.3686,
    lng: -1.5275,
  },
  {
    id: 'p2',
    name: 'Pharmacie du Progrès',
    type: 'pharmacy',
    address: 'Secteur 15, Ouagadougou',
    onDuty: true,
    distanceKm: 2.8,
    lat: 12.3914,
    lng: -1.5072,
  },
  {
    id: 'p3',
    name: 'Pharmacie de la Liberté',
    type: 'pharmacy',
    address: 'Bobo-Dioulasso centre',
    onDuty: false,
    distanceKm: 3.5,
    lat: 11.1771,
    lng: -4.2979,
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

export const healthTips = [
  {
    id: 'h1',
    category: 'nutrition',
    title: 'Bien s’hydrater pendant la saison chaude',
    excerpt: 'Buvez de l’eau potable régulièrement pour éviter la déshydratation.',
  },
  {
    id: 'h2',
    category: 'hygiène',
    title: 'Se laver les mains au savon',
    excerpt: 'Un geste simple qui prévient de nombreuses maladies.',
  },
  {
    id: 'h3',
    category: 'paludisme',
    title: 'Dormir sous moustiquaire imprégnée',
    excerpt: 'La meilleure protection contre le paludisme, surtout pour les enfants.',
  },
]
