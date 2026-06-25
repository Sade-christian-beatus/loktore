import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { decodeRecord, logAccess } from '../lib/medicalRecord.js'
import { hasConsent } from './consents.js'

const router = Router()
router.use(requireAuth, requireRole('doctor'))

// GET /patients/:id/medical-record — accès médecin, conditionné au consentement.
// Tout accès est journalisé (actorId = médecin).
router.get('/:id/medical-record', async (req, res, next) => {
  try {
    const patientId = req.params.id
    if (!(await hasConsent(req.user.id, patientId))) {
      return res.status(403).json({ message: 'Consentement du patient requis' })
    }
    const record = await prisma.medicalRecord.findUnique({ where: { patientId } })
    await logAccess(req.user.id, patientId, 'read')
    if (!record) {
      return res.json({ patientId, bloodType: null, allergies: [], chronicConditions: [], history: null })
    }
    res.json(decodeRecord(record))
  } catch (err) {
    next(err)
  }
})

export default router
