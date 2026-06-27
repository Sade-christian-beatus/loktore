/**
 * Logger structuré JSON — interface compatible Pino.
 * Remplacez ce module par `import pino from 'pino'` dès que pino est installé.
 *
 * Niveaux : trace=10, debug=20, info=30, warn=40, error=50, fatal=60
 */

const LEVELS = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 }
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? (process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug)
const SERVICE = 'loktore-api'

function write(level, obj, msg) {
  if (LEVELS[level] < MIN_LEVEL) return
  const entry = {
    level: LEVELS[level],
    time: Date.now(),
    service: SERVICE,
    env: process.env.NODE_ENV || 'development',
    msg: typeof obj === 'string' ? obj : msg,
    ...(typeof obj === 'object' && obj !== null ? obj : {}),
  }
  const out = JSON.stringify(entry)
  if (LEVELS[level] >= LEVELS.error) {
    process.stderr.write(out + '\n')
  } else {
    process.stdout.write(out + '\n')
  }
}

function makeLogger(bindings = {}) {
  const log = {}
  for (const level of Object.keys(LEVELS)) {
    log[level] = (obj, msg) => {
      const merged = typeof obj === 'object' && obj !== null ? { ...bindings, ...obj } : bindings
      write(level, typeof obj === 'string' ? { ...bindings, msg: obj } : merged, msg)
    }
  }
  log.child = (extra) => makeLogger({ ...bindings, ...extra })
  return log
}

export const logger = makeLogger()

/**
 * Middleware Express de logging HTTP structuré.
 * Enregistre chaque requête avec méthode, URL, statut et durée.
 */
export function httpLogger(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    logger[level]({
      req: { method: req.method, url: req.url, ip: req.ip },
      res: { status: res.statusCode },
      responseTime: ms,
      msg: `${req.method} ${req.url} ${res.statusCode} ${ms}ms`,
    })
  })
  next()
}
