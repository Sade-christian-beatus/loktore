import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { encrypt, decrypt, encryptArray, decryptArray } from '../utils/crypto.js'

const router = Router()

// Le dossier médical est réservé aux patients.
router.use(requireAuth, requireRole('patient'))

// Toutes ces routes touchent le dossier médical : propriété stricte (cf. plan §6).
// req.user.id est l'unique propriétaire autorisé — aucun paramètre d'id client.
// Les champs sensibles sont chiffrés au repos (cf. PLAN §7.4).

function encodeForStorage(body) {
  const data = {}
  if (body.bloodType !== undefined) data.bloodType = encrypt(body.bloodType)
  if (body.allergies !== undefined) data.allergies = encryptArray(body.allergies)
  if (body.chronicConditions !== undefined) {
    data.chronicConditions = encryptArray(body.chronicConditions)
  }
  if (body.history !== undefined) {
    data.history = body.history == null ? null : { __enc: encrypt(JSON.stringify(body.history)) }
  }
  return data
}

// Journalise un accès au dossier (best-effort, ne bloque pas la réponse).
function logAccess(actorId, patientId, action) {
  return prisma.medicalAccessLog
    .create({ data: { actorId, patientId, action } })
    .catch(() => {})
}

function decodeRecord(rec) {
  let history = rec.history
  if (history && history.__enc) {
    try {
      history = JSON.parse(decrypt(history.__enc))
    } catch {
      history = null
    }
  }
  return {
    ...rec,
    bloodType: decrypt(rec.bloodType),
    allergies: decryptArray(rec.allergies),
    chronicConditions: decryptArray(rec.chronicConditions),
    history,
  }
}

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
    await logAccess(req.user.id, req.user.id, 'read')
    res.json(decodeRecord(record))
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
    const data = encodeForStorage(req.body)
    const record = await prisma.medicalRecord.upsert({
      where: { patientId: req.user.id },
      update: data,
      create: { patientId: req.user.id, ...data },
    })
    await logAccess(req.user.id, req.user.id, 'write')
    res.json(decodeRecord(record))
  } catch (err) {
    next(err)
  }
})

export default router
