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

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribe, () => state)

  return {
    user: snapshot.user,
    async login({ email, password }) {
      // Tente l'API ; en cas d'échec (backend absent), bascule en démo.
      try {
        const { user, token } = await api.post('/auth/login', { email, password })
        api.setToken(token)
        setState({ user })
        return user
      } catch {
        const demoUser = {
          id: 'demo',
          email,
          fullName: email.split('@')[0] || 'Patient',
          role: 'patient',
          demo: true,
        }
        setState({ user: demoUser })
        return demoUser
      }
    },
    logout() {
      api.setToken(null)
      setState({ user: null })
    },
  }
}
