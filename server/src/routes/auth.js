import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  fullName: z.string().min(2),
  phone: z.string().min(8).optional(),
  preferredLanguage: z.enum(['fr', 'moore']).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

function publicProfile(p) {
  return {
    id: p.id,
    email: p.email,
    fullName: p.fullName,
    role: p.role,
    preferredLanguage: p.preferredLanguage,
  }
}

async function issueTokens(profile) {
  const token = signAccessToken(profile)
  const refresh = signRefreshToken(profile)
  // Décode l'expiration pour la stocker (révocabilité).
  const decoded = verifyRefreshToken(refresh)
  await prisma.refreshToken.create({
    data: {
      token: refresh,
      profileId: profile.id,
      expiresAt: new Date(decoded.exp * 1000),
    },
  })
  return { token, refresh }
}

// POST /auth/register — crée un compte (rôle patient par défaut)
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const exists = await prisma.profile.findUnique({ where: { email: req.body.email } })
    if (exists) return res.status(409).json({ message: 'Cet e-mail est déjà utilisé' })

    const profile = await prisma.profile.create({
      data: {
        email: req.body.email,
        passwordHash: await hashPassword(req.body.password),
        fullName: req.body.fullName,
        phone: req.body.phone,
        preferredLanguage: req.body.preferredLanguage || 'fr',
      },
    })
    const { token, refresh } = await issueTokens(profile)
    res.status(201).json({ user: publicProfile(profile), token, refresh })
  } catch (err) {
    next(err)
  }
})

// POST /auth/login — connexion, renvoie un JWT
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({ where: { email: req.body.email } })
    if (!profile || !(await verifyPassword(req.body.password, profile.passwordHash))) {
      return res.status(401).json({ message: 'Identifiants incorrects' })
    }
    const { token, refresh } = await issueTokens(profile)
    res.json({ user: publicProfile(profile), token, refresh })
  } catch (err) {
    next(err)
  }
})

// POST /auth/refresh — renouvelle le jeton d'accès (avec rotation)
router.post('/refresh', async (req, res) => {
  try {
    const { refresh } = req.body
    if (!refresh) return res.status(400).json({ message: 'Jeton de rafraîchissement requis' })

    const payload = verifyRefreshToken(refresh)
    const stored = await prisma.refreshToken.findUnique({ where: { token: refresh } })
    if (!stored || stored.revokedAt) {
      return res.status(401).json({ message: 'Session expirée, reconnectez-vous' })
    }

    const profile = await prisma.profile.findUnique({ where: { id: payload.sub } })
    if (!profile) return res.status(401).json({ message: 'Utilisateur introuvable' })

    // Rotation : révoque l'ancien, émet un nouveau couple.
    await prisma.refreshToken.update({
      where: { token: refresh },
      data: { revokedAt: new Date() },
    })
    const tokens = await issueTokens(profile)
    res.json({ user: publicProfile(profile), ...tokens })
  } catch {
    res.status(401).json({ message: 'Jeton de rafraîchissement invalide' })
  }
})

// POST /auth/logout — invalide la session courante
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    if (req.body?.refresh) {
      await prisma.refreshToken.updateMany({
        where: { token: req.body.refresh, profileId: req.user.id },
        data: { revokedAt: new Date() },
      })
    }
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// GET /auth/me — profil courant
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({ where: { id: req.user.id } })
    if (!profile) return res.status(404).json({ message: 'Profil introuvable' })
    res.json({ user: publicProfile(profile) })
  } catch (err) {
    next(err)
  }
})

export default router
