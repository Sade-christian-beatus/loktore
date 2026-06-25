import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(requireAuth)

// Renvoie la conversation si l'utilisateur en est membre, sinon null.
// Exporté pour être réutilisé par la couche Socket.IO.
export async function getMemberConversation(conversationId, userId) {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conv) return null
  if (conv.patientId !== userId && conv.doctorId !== userId) return null
  return conv
}

// GET /conversations — mes conversations (patient ou médecin), avec dernier message
router.get('/', async (req, res, next) => {
  try {
    const me = req.user.id
    const list = await prisma.conversation.findMany({
      where: { OR: [{ patientId: me }, { doctorId: me }] },
      orderBy: { updatedAt: 'desc' },
      include: {
        patient: { select: { id: true, fullName: true } },
        doctor: { select: { id: true, fullName: true } },
      },
    })
    // Ajoute le dernier message de chaque conversation.
    const withLast = await Promise.all(
      list.map(async (c) => {
        const last = await prisma.message.findFirst({
          where: { conversationId: c.id },
          orderBy: { createdAt: 'desc' },
        })
        const other = c.patientId === me ? c.doctor : c.patient
        return { id: c.id, other, lastMessage: last, updatedAt: c.updatedAt }
      }),
    )
    res.json(withLast)
  } catch (err) {
    next(err)
  }
})

const createSchema = z.object({ doctorId: z.string().uuid() })

// POST /conversations — un patient ouvre (ou retrouve) une conversation avec un médecin
router.post('/', requireRole('patient'), validate(createSchema), async (req, res, next) => {
  try {
    const doctor = await prisma.profile.findUnique({
      where: { id: req.body.doctorId },
      select: { role: true },
    })
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({ message: 'Médecin introuvable' })
    }
    const conv = await prisma.conversation.upsert({
      where: { patientId_doctorId: { patientId: req.user.id, doctorId: req.body.doctorId } },
      update: {},
      create: { patientId: req.user.id, doctorId: req.body.doctorId },
    })
    res.status(201).json(conv)
  } catch (err) {
    next(err)
  }
})

// GET /conversations/:id/messages — historique (membres uniquement)
router.get('/:id/messages', async (req, res, next) => {
  try {
    const conv = await getMemberConversation(req.params.id, req.user.id)
    if (!conv) return res.status(403).json({ message: 'Accès refusé à cette conversation' })
    const messages = await prisma.message.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: 'asc' },
    })
    res.json(messages)
  } catch (err) {
    next(err)
  }
})

const messageSchema = z.object({ content: z.string().min(1).max(2000) })

// POST /conversations/:id/messages — envoyer (membres) + diffusion temps réel
router.post('/:id/messages', validate(messageSchema), async (req, res, next) => {
  try {
    const conv = await getMemberConversation(req.params.id, req.user.id)
    if (!conv) return res.status(403).json({ message: 'Accès refusé à cette conversation' })

    const message = await prisma.message.create({
      data: { conversationId: conv.id, senderId: req.user.id, content: req.body.content },
    })
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    })

    // Diffusion aux membres connectés à la room.
    req.app.get('io')?.to(`conv:${conv.id}`).emit('message:new', message)
    res.status(201).json(message)
  } catch (err) {
    next(err)
  }
})

export default router
