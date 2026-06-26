import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { confirmPayment } from '../lib/payments.js'

const router = Router()
router.use(requireAuth, requireRole('patient'))

// Vérifie que le paiement appartient bien à une commande du patient.
async function ownedPayment(paymentId, patientId) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { select: { patientId: true } } },
  })
  if (!payment || payment.order.patientId !== patientId) return null
  return payment
}

// GET /payments/:id — statut d'un paiement
router.get('/:id', async (req, res, next) => {
  try {
    const payment = await ownedPayment(req.params.id, req.user.id)
    if (!payment) return res.status(404).json({ message: 'Paiement introuvable' })
    res.json(payment)
  } catch (err) {
    next(err)
  }
})

// POST /payments/:id/confirm — confirme le paiement (simule le retour fournisseur)
router.post('/:id/confirm', async (req, res, next) => {
  try {
    const payment = await ownedPayment(req.params.id, req.user.id)
    if (!payment) return res.status(404).json({ message: 'Paiement introuvable' })
    if (payment.status === 'succeeded') return res.json(payment)

    const { status } = confirmPayment(payment.reference)
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

export default router
