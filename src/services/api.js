// Client HTTP minimal pour l'API Loktoré.
// Injecte le jeton JWT, passe par le proxy Vite (/api -> :4000 en dev),
// et rejoue automatiquement le refresh token sur expiration (401).

const BASE = import.meta.env.VITE_API_URL || '/api/v1'
const TOKEN_KEY = 'loktore.token'
const REFRESH_KEY = 'loktore.refresh'

let token = localStorage.getItem(TOKEN_KEY)
let refresh = localStorage.getItem(REFRESH_KEY)
let onAuthExpired = null

async function tryRefresh() {
  if (!refresh) return false
  try {
    const res = await fetch(BASE + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) throw new Error('refresh refusé')
    const data = await res.json()
    api.setToken(data.token)
    api.setRefresh(data.refresh)
    return true
  } catch {
    api.setToken(null)
    api.setRefresh(null)
    if (onAuthExpired) onAuthExpired()
    return false
  }
}

async function request(method, path, body, retried = false) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  // Jeton expiré : on tente un refresh transparent puis on rejoue une fois.
  if (res.status === 401 && !retried && refresh && !path.startsWith('/auth/')) {
    if (await tryRefresh()) return request(method, path, body, true)
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    throw new Error(detail.message || `Erreur ${res.status}`)
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  setToken(value) {
    token = value
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
  },
  setRefresh(value) {
    refresh = value
    if (value) localStorage.setItem(REFRESH_KEY, value)
    else localStorage.removeItem(REFRESH_KEY)
  },
  // Appelé quand le refresh échoue (session réellement expirée).
  setAuthExpiredHandler(fn) {
    onAuthExpired = fn
  },
  // Vrai si une session API réelle est active (jeton présent).
  // En mode démo (aucun jeton), les ressources servent les données locales.
  hasToken: () => Boolean(token),
  getToken: () => token,
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
}
