/**
 * Pipeline principal — orchestré en trois étapes : fetch → verify → publish.
 * Peut être déclenché manuellement (API) ou via le scheduler.
 */
import { fetchAll, SOURCES } from './fetcher.js'
import { verifyBatch }       from './verifier.js'
import { publishReports, startJob, finishJob } from './publisher.js'
import { logger } from '../../lib/logger.js'

export async function runPipeline(options = {}) {
  const sources = options.sources ?? Object.keys(SOURCES)
  const job = await startJob(sources.join(','))

  logger.info({ jobId: job.id, sources }, 'Pipeline africain démarré')

  try {
    // 1. Collecte
    const fetched = await fetchAll(sources)
    logger.info({ count: fetched.length }, 'Rapports collectés')

    // 2. Vérification
    const { verified, skipped } = await verifyBatch(fetched)
    logger.info({ verified: verified.length, skipped: skipped.length }, 'Vérification terminée')

    // 3. Publication
    const { count } = await publishReports(verified)

    await finishJob(job.id, {
      fetched:   fetched.length,
      verified:  verified.length,
      published: count,
    })

    logger.info({ jobId: job.id, published: count }, 'Pipeline africain terminé')
    return { jobId: job.id, fetched: fetched.length, verified: verified.length, published: count }

  } catch (err) {
    await finishJob(job.id, { errorMsg: err.message })
    logger.error({ err, jobId: job.id }, 'Erreur pipeline africain')
    throw err
  }
}
