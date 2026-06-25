import { verifyAccessToken } from '../utils/jwt.js'

// Vérifie le jeton JWT et attache l'utilisateur à req.user.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ message: 'Jeton d’authentification requis' })
  }
  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, role: payload.role, email: payload.email }
    next()
  } catch {
    return res.status(401).json({ message: 'Jeton invalide ou expiré' })
  }
}

// Filtre par rôle (cf. plan §6 : middleware requireRole).
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé pour ce rôle' })
    }
    next()
  }
}

// Garde-fou central pour les données médicales (cf. plan §6 : assertOwnership).
// Lève une erreur 403 si l'utilisateur n'est pas propriétaire de la ressource.
export function assertOwnership(req, ownerId) {
  if (req.user.id !== ownerId) {
    const err = new Error('Vous n’êtes pas autorisé à accéder à cette ressource')
    err.status = 403
    throw err
  }
}
