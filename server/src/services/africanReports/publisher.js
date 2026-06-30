/**
 * Publisher — persiste les rapports vérifiés en base de données.
 * Marque les rapports comme publiés et enregistre les résultats du job.
 */
import { prisma } from '../../lib/prisma.js'
import { logger } from '../../lib/logger.js'

export async function publishReports(reports) {
  if (reports.length === 0) return { count: 0, ids: [] }

  const data = reports.map(r => ({
    title:       r.title,
    description: r.description ?? null,
    source:      r.source,
    sourceUrl:   r.sourceUrl,
    country:     r.country,
    countryName: r.countryName,
    category:    r.category,
    reportedAt:  r.reportedAt,
    verified:    true,
    verifiedAt:  new Date(),
    published:   true,
    releasedAt:  new Date(),
    rawData:     r.rawData ?? undefined,
    language:    r.language ?? 'fr',
    tags:        r.tags ?? [],
  }))

  // createMany avec skipDuplicates pour la sécurité
  const result = await prisma.africanReport.createMany({
    data,
    skipDuplicates: true,
  })

  logger.info({ count: result.count }, 'Rapports publiés en base')
  return { count: result.count }
}

export async function startJob(source) {
  return prisma.africanReportJob.create({
    data: { source, status: 'running' },
  })
}

export async function finishJob(jobId, stats) {
  return prisma.africanReportJob.update({
    where: { id: jobId },
    data: {
      finishedAt: new Date(),
      status:     stats.errorMsg ? 'error' : 'done',
      fetched:    stats.fetched  ?? 0,
      verified:   stats.verified ?? 0,
      published:  stats.published ?? 0,
      errorMsg:   stats.errorMsg ?? null,
    },
  })
}
