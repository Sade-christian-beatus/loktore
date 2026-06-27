import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /medications/search?q=xxx — cherche un médicament dans toutes les pharmacies
router.get('/medications/search', requireAuth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q) return res.json([])
    const meds = await prisma.medication.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
      },
      include: {
        facility: { select: { id: true, name: true, address: true, phone: true, onDuty: true } },
      },
      orderBy: [{ inStock: 'desc' }, { name: 'asc' }],
    })
    res.json(meds)
  } catch (err) {
    next(err)
  }
})

// GET /facilities/:id/medications — catalogue d'une pharmacie (pour commander)
router.get('/facilities/:id/medications', requireAuth, async (req, res, next) => {
  try {
    const meds = await prisma.medication.findMany({
      where: { facilityId: req.params.id },
      orderBy: { name: 'asc' },
    })
    res.json(meds)
  } catch (err) {
    next(err)
  }
})

// GET /doctors — liste filtrable (spécialité, en ligne). Données non sensibles.
router.get('/doctors', requireAuth, async (req, res, next) => {
  try {
    const where = {}
    if (req.query.speciality) where.speciality = req.query.speciality
    if (req.query.online === 'true') where.isOnline = true

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        profile: { select: { fullName: true, avatarUrl: true } },
        facility: { select: { name: true, address: true } },
      },
    })
    res.json(doctors)
  } catch (err) {
    next(err)
  }
})

// GET /facilities?lat=&lng=&type=&onDuty= — recherche de proximité.
// Filtrage simple ici ; le tri géographique fin pourra passer en PostGIS plus tard.
router.get('/facilities', requireAuth, async (req, res, next) => {
  try {
    const where = {}
    if (req.query.type) where.type = req.query.type
    if (req.query.onDuty === 'true') where.onDuty = true

    let facilities = await prisma.facility.findMany({ where })

    const { lat, lng } = req.query
    if (lat && lng) {
      const la = Number(lat)
      const ln = Number(lng)
      // Distance approchée (équirectangulaire) suffisante pour trier des points proches.
      facilities = facilities
        .map((f) => {
          const x = (f.longitude - ln) * Math.cos((la * Math.PI) / 180)
          const y = f.latitude - la
          return { ...f, distanceKm: Math.sqrt(x * x + y * y) * 111.32 }
        })
        .sort((a, b) => a.distanceKm - b.distanceKm)
    }
    res.json(facilities)
  } catch (err) {
    next(err)
  }
})

export default router
