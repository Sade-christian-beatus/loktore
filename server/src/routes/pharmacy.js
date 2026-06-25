import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth, requireRole('facility'))

// Récupère la structure (pharmacie) appartenant à l'utilisateur courant.
async function ownedFacility(userId) {
  return prisma.facility.findFirst({ where: { ownerId: userId } })
}

// GET /pharmacy/me — la structure gérée par l'utilisateur
router.get('/me', async (req, res, next) => {
  try {
    const facility = await ownedFacility(req.user.id)
    if (!facility) return res.status(404).json({ message: 'Aucune structure associée à ce compte' })
    res.json(facility)
  } catch (err) {
    next(err)
  }
})

// GET /pharmacy/medications — médicaments de sa structure
router.get('/medications', async (req, res, next) => {
  try {
    const facility = await ownedFacility(req.user.id)
    if (!facility) return res.json([])
    const meds = await prisma.medication.findMany({
      where: { facilityId: facility.id },
      orderBy: { name: 'asc' },
    })
    res.json(meds)
  } catch (err) {
    next(err)
  }
})

const medSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.coerce.number().int().nonnegative().optional(),
  inStock: z.boolean().optional(),
})

// POST /pharmacy/medications — ajouter un produit
router.post('/medications', validate(medSchema), async (req, res, next) => {
  try {
    const facility = await ownedFacility(req.user.id)
    if (!facility) return res.status(400).json({ message: 'Aucune structure associée' })
    const med = await prisma.medication.create({
      data: { facilityId: facility.id, ...req.body },
    })
    res.status(201).json(med)
  } catch (err) {
    next(err)
  }
})

const patchSchema = medSchema.partial()

// PATCH /pharmacy/medications/:id — maj (prix, stock…)
router.patch('/medications/:id', validate(patchSchema), async (req, res, next) => {
  try {
    const facility = await ownedFacility(req.user.id)
    const med = await prisma.medication.findUnique({ where: { id: req.params.id } })
    if (!med || !facility || med.facilityId !== facility.id) {
      return res.status(404).json({ message: 'Produit introuvable' })
    }
    const updated = await prisma.medication.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// DELETE /pharmacy/medications/:id — retirer un produit
router.delete('/medications/:id', async (req, res, next) => {
  try {
    const facility = await ownedFacility(req.user.id)
    const med = await prisma.medication.findUnique({ where: { id: req.params.id } })
    if (!med || !facility || med.facilityId !== facility.id) {
      return res.status(404).json({ message: 'Produit introuvable' })
    }
    await prisma.medication.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router
