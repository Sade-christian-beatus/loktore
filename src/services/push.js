import { api } from './api.js'

// Convertit la clé VAPID (base64url) en Uint8Array attendu par PushManager.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

// Active les notifications : permission → abonnement PushManager → envoi au backend.
// Lève une erreur explicite si non supporté / refusé / désactivé côté serveur.
export async function enableNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Notifications non supportées par ce navigateur.')
  }
  const { enabled, key } = await api.get('/push/key')
  if (!enabled || !key) {
    throw new Error('Notifications désactivées côté serveur (clés VAPID absentes).')
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Permission de notification refusée.')
  }
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  })
  const json = sub.toJSON()
  await api.post('/push/subscribe', { endpoint: json.endpoint, keys: json.keys })
  await api.post('/push/test')
  return true
}

export const notificationsSupported = () =>
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
