import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

// Le dossier médical est réservé aux patients.
router.use(requireAuth, requireRole('patient'))

// Toutes ces routes touchent le dossier médical : propriété stricte (cf. plan §6).
// req.user.id est l'unique propriétaire autorisé — aucun paramètre d'id client.

// GET /me/medical-record — lit SON dossier
router.get('/medical-record', async (req, res, next) => {
  try {
    let record = await prisma.medicalRecord.findUnique({
      where: { patientId: req.user.id },
    })
    // Crée un dossier vide à la première consultation.
    if (!record) {
      record = await prisma.medicalRecord.create({ data: { patientId: req.user.id } })
    }
    res.json(record)
  } catch (err) {
    next(err)
  }
})

const updateSchema = z.object({
  bloodType: z.string().max(3).optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  history: z.any().optional(),
})

// PUT /me/medical-record — met à jour SON dossier
router.put('/medical-record', validate(updateSchema), async (req, res, next) => {
  try {
    const record = await prisma.medicalRecord.upsert({
      where: { patientId: req.user.id },
      update: req.body,
      create: { patientId: req.user.id, ...req.body },
    })
    res.json(record)
  } catch (err) {
    next(err)
  }
})

export default router
