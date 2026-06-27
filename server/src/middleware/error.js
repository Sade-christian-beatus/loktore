import { logger } from '../lib/logger.js'

// Gestionnaire d'erreurs centralisé.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500
  if (status >= 500) {
    logger.error({ err: { message: err.message, stack: err.stack }, req: { method: req.method, url: req.url } }, 'Erreur interne')
  }
  res.status(status).json({
    message: status >= 500 ? 'Erreur interne du serveur' : err.message,
  })
}

export function notFound(req, res) {
  res.status(404).json({ message: 'Ressource introuvable' })
}
