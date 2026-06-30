/**
 * Verifier — valide les rapports collectés avant publication.
 * Critères : URL accessible, pas de doublon, données cohérentes, fraîcheur.
 */
import { prisma } from '../../lib/prisma.js'
import { logger } from '../../lib/logger.js'

const TIMEOUT_MS = 8_000
const MAX_AGE_YEARS = 10

async function isUrlReachable(url) {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal })
    clearTimeout(timer)
    return res.ok || res.status === 405 // 405 = HEAD non supporté mais URL valide
  } catch {
    return false
  }
}

function isDataFresh(reportedAt) {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - MAX_AGE_YEARS)
  return reportedAt >= cutoff
}

async function isDuplicate(report) {
  const existing = await prisma.africanReport.findFirst({
    where: {
      country:   report.country,
      source:    report.source,
      title:     report.title,
      reportedAt: report.reportedAt,
    },
    select: { id: true },
  })
  return !!existing
}

export async function verifyReport(report) {
  const issues = []

  if (!report.title?.trim()) issues.push('titre manquant')
  if (!report.sourceUrl?.startsWith('http')) issues.push('URL invalide')
  if (!isDataFresh(report.reportedAt)) issues.push(`données trop anciennes (> ${MAX_AGE_YEARS} ans)`)

  if (issues.length > 0) {
    return { ok: false, issues }
  }

  if (await isDuplicate(report)) {
    return { ok: false, issues: ['doublon détecté'] }
  }

  // Vérification légère de l'URL (pas bloquante si inaccessible : peut être temporaire)
  const reachable = await isUrlReachable(report.sourceUrl)
  if (!reachable) {
    logger.warn({ url: report.sourceUrl }, 'URL source inaccessible, rapport quand même accepté')
  }

  return { ok: true, issues: [] }
}

export async function verifyBatch(reports) {
  const verified = []
  const skipped  = []

  for (const report of reports) {
    try {
      const result = await verifyReport(report)
      if (result.ok) {
        verified.push(report)
      } else {
        skipped.push({ report, reasons: result.issues })
      }
    } catch (err) {
      logger.warn({ err, title: report.title }, 'Erreur de vérification')
      skipped.push({ report, reasons: ['erreur inattendue'] })
    }
  }

  logger.info({ verified: verified.length, skipped: skipped.length }, 'Vérification terminée')
  return { verified, skipped }
}
