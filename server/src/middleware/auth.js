// @ts-check
import { verifyAccessToken } from '../utils/jwt.js'

/**
 * @typedef {{ id: string; role: string; email: string }} AuthUser
 */

/**
 * Vérifie le jeton JWT et attache l'utilisateur à req.user.
 * @type {import('express').RequestHandler}
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ message: 'Jeton d'authentification requis' })
  }
  try {
    const payload = verifyAccessToken(token)
    // @ts-ignore — req.user est une extension locale non typée par @types/express
    req.user = { id: payload.sub, role: payload.role, email: payload.email }
    next()
  } catch {
    return res.status(401).json({ message: 'Jeton invalide ou expiré' })
  }
}

/**
 * Filtre par rôle.
 * @param {...string} roles
 * @returns {import('express').RequestHandler}
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    // @ts-ignore
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé pour ce rôle' })
    }
    next()
  }
}

/**
 * Garde-fou central pour les données médicales.
 * Lève une erreur 403 si l'utilisateur n'est pas propriétaire de la ressource.
 * @param {import('express').Request & { user: AuthUser }} req
 * @param {string} ownerId
 * @returns {void}
 */
export function assertOwnership(req, ownerId) {
  if (req.user.id !== ownerId) {
    const err = new Error('Vous n'êtes pas autorisé à accéder à cette ressource')
    // @ts-ignore
    err.status = 403
    throw err
  }
}
