import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole, assertOwnership } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

// GET /appointments — liste les RDV de l'utilisateur (patient ou médecin)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const where =
      req.user.role === 'doctor'
        ? { doctorId: req.user.id }
        : { patientId: req.user.id }
    if (req.query.status) where.status = req.query.status

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        doctor: { select: { fullName: true } },
        patient: { select: { fullName: true } },
      },
    })
    res.json(appointments)
  } catch (err) {
    next(err)
  }
})

const createSchema = z.object({
  doctorId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
  reason: z.string().max(500).optional(),
})

// POST /appointments — réserve un créneau (patient uniquement)
router.post(
  '/',
  requireAuth,
  requireRole('patient'),
  validate(createSchema),
  async (req, res, next) => {
    try {
      // Le doctorId doit correspondre à un profil de rôle « doctor ».
      const doctor = await prisma.profile.findUnique({
        where: { id: req.body.doctorId },
        select: { role: true },
      })
      if (!doctor || doctor.role !== 'doctor') {
        return res.status(400).json({ message: 'Médecin introuvable' })
      }

      // Anti-conflit : pas deux RDV actifs sur le même créneau pour ce médecin.
      const clash = await prisma.appointment.findFirst({
        where: {
          doctorId: req.body.doctorId,
          scheduledAt: req.body.scheduledAt,
          status: { in: ['pending', 'confirmed'] },
        },
      })
      if (clash) {
        return res.status(409).json({ message: 'Ce créneau est déjà réservé' })
      }

      const appointment = await prisma.appointment.create({
        data: {
          patientId: req.user.id,
          doctorId: req.body.doctorId,
          scheduledAt: req.body.scheduledAt,
          reason: req.body.reason,
        },
      })
      res.status(201).json(appointment)
    } catch (err) {
      next(err)
    }
  },
)

const patchSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'done']),
})

// PATCH /appointments/:id — confirmer / annuler (acteur du RDV uniquement)
router.patch('/:id', requireAuth, validate(patchSchema), async (req, res, next) => {
  try {
    const appt = await prisma.appointment.findUnique({ where: { id: req.params.id } })
    if (!appt) return res.status(404).json({ message: 'Rendez-vous introuvable' })

    // Seul le patient ou le médecin concerné peut modifier.
    if (req.user.id !== appt.patientId && req.user.id !== appt.doctorId) {
      assertOwnership(req, appt.patientId)
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

export default router
