import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

// Espace d'administration : réservé au rôle « admin ».
router.use(requireAuth, requireRole('admin'))

// GET /admin/stats — quelques compteurs pour un futur tableau de bord.
router.get('/stats', async (req, res, next) => {
  try {
    const [patients, doctors, facilities, appointments] = await Promise.all([
      prisma.profile.count({ where: { role: 'patient' } }),
      prisma.profile.count({ where: { role: 'doctor' } }),
      prisma.facility.count(),
      prisma.appointment.count(),
    ])
    res.json({ patients, doctors, facilities, appointments })
  } catch (err) {
    next(err)
  }
})

// GET /admin/users — liste paginée des comptes (sans données sensibles).
router.get('/users', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(100, Number(req.query.limit) || 20)
    const [total, users] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      }),
    ])
    res.json({ page, limit, total, users })
  } catch (err) {
    next(err)
  }
})

export default router
