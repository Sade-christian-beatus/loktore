/**
 * Routes /api/v1/reports — rapports africains.
 * Lecture publique, déclenchement du pipeline réservé aux admins.
 */
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { runPipeline } from '../services/africanReports/pipeline.js'
import { schedulerStatus } from '../services/africanReports/scheduler.js'
import { AFRICAN_COUNTRIES } from '../services/africanReports/countries.js'

const router = Router()

// GET /reports — liste paginée avec filtres
router.get('/', async (req, res, next) => {
  try {
    const page     = Math.max(1, Number(req.query.page)  || 1)
    const limit    = Math.min(100, Number(req.query.limit) || 20)
    const country  = req.query.country  || undefined
    const category = req.query.category || undefined
    const source   = req.query.source   || undefined
    const q        = req.query.q        || undefined

    const where = {
      published: true,
      ...(country  && { country }),
      ...(category && { category }),
      ...(source   && { source }),
      ...(q && {
        OR: [
          { title:       { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { countryName: { contains: q, mode: 'insensitive' } },
        ],
      }),
    }

    const [total, reports] = await Promise.all([
      prisma.africanReport.count({ where }),
      prisma.africanReport.findMany({
        where,
        orderBy: { reportedAt: 'desc' },
        skip:  (page - 1) * limit,
        take:  limit,
        select: {
          id: true, title: true, description: true, source: true, sourceUrl: true,
          country: true, countryName: true, category: true, reportedAt: true,
          releasedAt: true, language: true, tags: true,
        },
      }),
    ])

    res.json({ page, limit, total, pages: Math.ceil(total / limit), reports })
  } catch (err) {
    next(err)
  }
})

// GET /reports/countries — liste des pays disponibles avec compteur
router.get('/countries', async (req, res, next) => {
  try {
    const counts = await prisma.africanReport.groupBy({
      by: ['country', 'countryName'],
      where: { published: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })
    res.json(counts.map(c => ({
      code:  c.country,
      name:  c.countryName,
      total: c._count.id,
    })))
  } catch (err) {
    next(err)
  }
})

// GET /reports/stats — statistiques globales
router.get('/stats', async (req, res, next) => {
  try {
    const [total, byCategory, bySource, latestJob] = await Promise.all([
      prisma.africanReport.count({ where: { published: true } }),
      prisma.africanReport.groupBy({
        by: ['category'],
        where: { published: true },
        _count: { id: true },
      }),
      prisma.africanReport.groupBy({
        by: ['source'],
        where: { published: true },
        _count: { id: true },
      }),
      prisma.africanReportJob.findFirst({
        orderBy: { startedAt: 'desc' },
      }),
    ])
    res.json({
      total,
      byCategory: Object.fromEntries(byCategory.map(r => [r.category, r._count.id])),
      bySource:   Object.fromEntries(bySource.map(r => [r.source,   r._count.id])),
      latestJob,
      scheduler:  schedulerStatus(),
      countries:  AFRICAN_COUNTRIES.length,
    })
  } catch (err) {
    next(err)
  }
})

// GET /reports/:id — détail d'un rapport
router.get('/:id', async (req, res, next) => {
  try {
    const report = await prisma.africanReport.findUnique({
      where: { id: req.params.id },
    })
    if (!report || !report.published) {
      return res.status(404).json({ message: 'Rapport introuvable' })
    }
    res.json(report)
  } catch (err) {
    next(err)
  }
})

// POST /reports/pipeline/run — déclenche le pipeline manuellement (admin)
router.post('/pipeline/run', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const sources = req.body.sources ?? undefined
    // Démarre sans attendre la fin (peut prendre plusieurs minutes)
    runPipeline({ sources }).catch(err => {
      // loggé dans le pipeline lui-même
    })
    res.json({ message: 'Pipeline démarré en arrière-plan' })
  } catch (err) {
    next(err)
  }
})

// GET /reports/pipeline/jobs — historique des jobs (admin)
router.get('/pipeline/jobs', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const jobs = await prisma.africanReportJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
    })
    res.json(jobs)
  } catch (err) {
    next(err)
  }
})

export default router
