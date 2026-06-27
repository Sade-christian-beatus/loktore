import { useSyncExternalStore } from 'react'
import { api } from '../services/api.js'

// Petit store d'authentification sans dépendance (useSyncExternalStore).
// En mode démo (pas de backend), le login accepte n'importe quel identifiant.
const STORAGE_KEY = 'loktore.auth'

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

let state = { user: read() }
const listeners = new Set()

function setState(next) {
  state = next
  if (next.user) localStorage.setItem(STORAGE_KEY, JSON.stringify(next.user))
  else localStorage.removeItem(STORAGE_KEY)
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Si le refresh token expire pour de bon, on déconnecte proprement.
api.setAuthExpiredHandler(() => setState({ user: null }))

function persistSession({ user, token, refresh }) {
  api.setToken(token)
  api.setRefresh(refresh)
  setState({ user })
  return user
}

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribe, () => state)

  return {
    user: snapshot.user,
    async login({ identifier, password }) {
      // Tente l'API ; en cas d'échec (backend absent), bascule en démo.
      try {
        return persistSession(await api.post('/auth/login', { identifier, password }))
      } catch {
        const demoUser = {
          id: 'demo',
          email: identifier,
          fullName: identifier.replace(/^\+?226/, '').trim() || 'Patient',
          role: 'patient',
          demo: true,
        }
        setState({ user: demoUser })
        return demoUser
      }
    },
    // Inscription : action réelle, pas de repli démo (l'erreur remonte à l'UI).
    async register({ email, password, fullName, preferredLanguage }) {
      return persistSession(
        await api.post('/auth/register', { email, password, fullName, preferredLanguage }),
      )
    },
    // Met à jour l'utilisateur en mémoire après édition du profil.
    updateUser(partial) {
      setState({ user: { ...snapshot.user, ...partial } })
    },
    logout() {
      api.setToken(null)
      api.setRefresh(null)
      setState({ user: null })
    },
  }
}
