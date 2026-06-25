import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth)

// Vrai si le médecin a un consentement ACCORDÉ pour le dossier du patient.
export async function hasConsent(doctorId, patientId) {
  const c = await prisma.recordConsent.findUnique({
    where: { patientId_doctorId: { patientId, doctorId } },
  })
  return c?.status === 'granted'
}

// GET /consents — selon le rôle : le patient voit les demandes le concernant,
// le médecin voit ses propres demandes et leur statut.
router.get('/', async (req, res, next) => {
  try {
    const me = req.user.id
    if (req.user.role === 'doctor') {
      const list = await prisma.recordConsent.findMany({
        where: { doctorId: me },
        include: { patient: { select: { id: true, fullName: true } } },
        orderBy: { updatedAt: 'desc' },
      })
      return res.json(list)
    }
    const list = await prisma.recordConsent.findMany({
      where: { patientId: me },
      include: { doctor: { select: { id: true, fullName: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    res.json(list)
  } catch (err) {
    next(err)
  }
})

const requestSchema = z.object({ patientId: z.string().uuid() })

// POST /consents — un médecin demande l'accès au dossier d'un patient
router.post('/', requireRole('doctor'), validate(requestSchema), async (req, res, next) => {
  try {
    const patient = await prisma.profile.findUnique({
      where: { id: req.body.patientId },
      select: { role: true },
    })
    if (!patient || patient.role !== 'patient') {
      return res.status(400).json({ message: 'Patient introuvable' })
    }
    const existing = await prisma.recordConsent.findUnique({
      where: { patientId_doctorId: { patientId: req.body.patientId, doctorId: req.user.id } },
    })
    let consent
    if (!existing) {
      consent = await prisma.recordConsent.create({
        data: { patientId: req.body.patientId, doctorId: req.user.id, status: 'pending' },
      })
    } else if (existing.status === 'revoked') {
      // Nouvelle demande après révocation : repasse en attente.
      consent = await prisma.recordConsent.update({
        where: { id: existing.id },
        data: { status: 'pending' },
      })
    } else {
      consent = existing
    }
    res.status(201).json(consent)
  } catch (err) {
    next(err)
  }
})

const decideSchema = z.object({ status: z.enum(['granted', 'revoked']) })

// PATCH /consents/:id — le patient accorde ou révoque (propriétaire uniquement)
router.patch('/:id', requireRole('patient'), validate(decideSchema), async (req, res, next) => {
  try {
    const consent = await prisma.recordConsent.findUnique({ where: { id: req.params.id } })
    if (!consent || consent.patientId !== req.user.id) {
      return res.status(404).json({ message: 'Demande introuvable' })
    }
    const updated = await prisma.recordConsent.update({
      where: { id: consent.id },
      data: { status: req.body.status },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

export default router
