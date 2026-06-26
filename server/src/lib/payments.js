// Abstraction « fournisseur Mobile Money ».
// Implémentation mock (développement) : simule l'initiation et la confirmation.
// EN PRODUCTION : remplacer par l'intégration réelle (Orange Money / Moov Money)
// via leurs API serveur, avec webhook de confirmation. L'interface reste la même.

const PROVIDERS = ['orange', 'moov', 'mock']

export function normalizeProvider(p) {
  return PROVIDERS.includes(p) ? p : 'mock'
}

// Démarre une transaction : renvoie une référence et l'état initial.
// (En réel : déclenche le push USSD/STK vers le téléphone du client.)
export function initiatePayment({ provider, phone, amount }) {
  void provider
  void phone
  void amount
  const reference = 'MM-' + Math.random().toString(36).slice(2, 10).toUpperCase()
  return { reference, status: 'processing' }
}

// Confirme une transaction.
// (En réel : déclenché par le webhook du fournisseur après saisie du code par le
// client ; ici, on simule un succès.)
export function confirmPayment(reference) {
  void reference
  return { status: 'succeeded' }
}
