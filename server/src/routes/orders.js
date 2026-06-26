import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { initiatePayment, normalizeProvider } from '../lib/payments.js'

const router = Router()
router.use(requireAuth)

const orderInclude = {
  facility: { select: { id: true, name: true } },
  items: { include: { medication: { select: { name: true } } } },
  payment: true,
}

// GET /orders — les commandes du patient
router.get('/', requireRole('patient'), async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { patientId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    })
    res.json(orders)
  } catch (err) {
    next(err)
  }
})

const orderSchema = z.object({
  facilityId: z.string(),
  note: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        medicationId: z.string(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1),
})

// POST /orders — le patient commande des médicaments à une pharmacie
router.post('/', requireRole('patient'), validate(orderSchema), async (req, res, next) => {
  try {
    const facility = await prisma.facility.findUnique({ where: { id: req.body.facilityId } })
    if (!facility || facility.type !== 'pharmacy') {
      return res.status(400).json({ message: 'Pharmacie introuvable' })
    }

    const ids = req.body.items.map((i) => i.medicationId)
    const meds = await prisma.medication.findMany({
      where: { id: { in: ids }, facilityId: facility.id },
    })
    if (meds.length !== new Set(ids).size) {
      return res.status(400).json({ message: 'Produit invalide pour cette pharmacie' })
    }
    const priceById = Object.fromEntries(meds.map((m) => [m.id, m.price]))

    const order = await prisma.order.create({
      data: {
        patientId: req.user.id,
        facilityId: facility.id,
        note: req.body.note,
        items: {
          create: req.body.items.map((i) => ({
            medicationId: i.medicationId,
            quantity: i.quantity,
            priceAtOrder: priceById[i.medicationId] ?? null,
          })),
        },
      },
      include: orderInclude,
    })
    res.status(201).json(order)
  } catch (err) {
    next(err)
  }
})

// PATCH /orders/:id — le patient annule sa commande (si encore en attente)
router.patch('/:id', requireRole('patient'), async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } })
    if (!order || order.patientId !== req.user.id) {
      return res.status(404).json({ message: 'Commande introuvable' })
    }
    if (order.status !== 'pending') {
      return res.status(409).json({ message: 'Commande non annulable' })
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
      include: orderInclude,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

const paySchema = z.object({
  phone: z.string().min(8).max(20),
  provider: z.string().optional(),
})

// POST /orders/:id/pay — initie un paiement Mobile Money pour sa commande
router.post('/:id/pay', requireRole('patient'), validate(paySchema), async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, payment: true },
    })
    if (!order || order.patientId !== req.user.id) {
      return res.status(404).json({ message: 'Commande introuvable' })
    }
    if (order.status === 'cancelled') {
      return res.status(409).json({ message: 'Commande annulée' })
    }
    if (order.payment?.status === 'succeeded') {
      return res.status(409).json({ message: 'Commande déjà payée' })
    }

    const amount = order.items.reduce((s, it) => s + (it.priceAtOrder || 0) * it.quantity, 0)
    const provider = normalizeProvider(req.body.provider)
    const { reference, status } = initiatePayment({ provider, phone: req.body.phone, amount })

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { provider, phone: req.body.phone, amount, reference, status },
      create: { orderId: order.id, provider, phone: req.body.phone, amount, reference, status },
    })
    res.status(201).json(payment)
  } catch (err) {
    next(err)
  }
})

export default router
