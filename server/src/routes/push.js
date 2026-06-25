import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { pushEnabled, vapidPublicKey, sendToUser } from '../lib/push.js'

const router = Router()

// GET /push/key — clé publique VAPID (vide si push désactivé côté serveur)
router.get('/key', (req, res) => {
  res.json({ enabled: pushEnabled, key: vapidPublicKey })
})

router.use(requireAuth)

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
})

// POST /push/subscribe — enregistre l'abonnement du navigateur courant
router.post('/subscribe', validate(subSchema), async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, profileId: req.user.id },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, profileId: req.user.id },
    })
    res.status(201).json({ id: sub.id })
  } catch (err) {
    next(err)
  }
})

// POST /push/test — envoie une notification de test à soi-même
router.post('/test', async (req, res, next) => {
  try {
    await sendToUser(req.user.id, {
      title: 'Loktoré',
      body: 'Notifications activées ✅',
      url: '/',
    })
    res.json({ sent: true, enabled: pushEnabled })
  } catch (err) {
    next(err)
  }
})

export default router
