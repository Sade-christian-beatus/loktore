// Client HTTP minimal pour l'API Loktoré.
// Injecte le jeton JWT et passe par le proxy Vite (/api -> :4000 en dev).

const BASE = import.meta.env.VITE_API_URL || '/api/v1'
const TOKEN_KEY = 'loktore.token'

let token = localStorage.getItem(TOKEN_KEY)

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

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
  // Vrai si une session API réelle est active (jeton présent).
  // En mode démo (aucun jeton), les ressources servent les données locales.
  hasToken: () => Boolean(token),
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
}
