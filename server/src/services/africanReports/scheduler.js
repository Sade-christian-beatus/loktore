/**
 * Scheduler — exécute le pipeline automatiquement selon un intervalle configurable.
 * Utilise setInterval (Node.js natif), sans dépendance externe.
 * Lancer avec startScheduler() au démarrage du serveur.
 */
import { runPipeline } from './pipeline.js'
import { logger } from '../../lib/logger.js'

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 heures

let _timer = null
let _running = false

export function startScheduler(intervalMs = DEFAULT_INTERVAL_MS) {
  if (_timer) return // déjà actif
  logger.info({ intervalHours: intervalMs / 3_600_000 }, 'Scheduler africain démarré')

  // Premier run immédiat puis toutes les `intervalMs`
  _runSafe()
  _timer = setInterval(_runSafe, intervalMs)
}

export function stopScheduler() {
  if (_timer) {
    clearInterval(_timer)
    _timer = null
    logger.info('Scheduler africain arrêté')
  }
}

async function _runSafe() {
  if (_running) {
    logger.warn('Pipeline déjà en cours, run ignoré')
    return
  }
  _running = true
  try {
    await runPipeline()
  } catch (err) {
    logger.error({ err }, 'Erreur scheduler pipeline africain')
  } finally {
    _running = false
  }
}

export function schedulerStatus() {
  return { active: !!_timer, running: _running }
}
