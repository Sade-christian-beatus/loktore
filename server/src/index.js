import http from 'node:http'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { Server as SocketServer } from 'socket.io'

import { env } from './lib/env.js'
import { prisma } from './lib/prisma.js'
import { verifyAccessToken } from './utils/jwt.js'
import { errorHandler, notFound } from './middleware/error.js'

import authRouter from './routes/auth.js'
import meRouter from './routes/me.js'
import appointmentsRouter from './routes/appointments.js'
import directoryRouter from './routes/directory.js'

const app = express()

// Sécurité HTTP par défaut (cf. plan §2 : helmet, cors, rate-limit)
app.use(helmet())
app.use(cors({ origin: env.corsOrigin, credentials: true }))
app.use(express.json({ limit: '1mb' }))

// Limite de débit globale, plus stricte sur l'authentification.
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Routes versionnées sous /api/v1 (cf. plan §6)
const api = express.Router()
api.use('/auth', authLimiter, authRouter)
api.use('/me', meRouter)
api.use('/appointments', appointmentsRouter)
api.use('/', directoryRouter) // /doctors, /facilities
app.use('/api/v1', api)

app.use(notFound)
app.use(errorHandler)

// --- Serveur HTTP + Socket.IO (messagerie temps réel, cf. plan §6) ---
const server = http.createServer(app)
const io = new SocketServer(server, { cors: { origin: env.corsOrigin } })

// Authentifie chaque connexion socket via le JWT.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    socket.user = verifyAccessToken(token)
    next()
  } catch {
    next(new Error('Authentification socket requise'))
  }
})

io.on('connection', (socket) => {
  socket.on('conversation:join', (conversationId) => {
    socket.join(`conv:${conversationId}`)
  })

  socket.on('message:send', async ({ conversationId, content }) => {
    const message = await prisma.message.create({
      data: { conversationId, senderId: socket.user.sub, content },
    })
    io.to(`conv:${conversationId}`).emit('message:new', message)
  })
})

server.listen(env.port, () => {
  console.log(`API Loktoré sur http://localhost:${env.port} (${env.nodeEnv})`)
})

// Arrêt propre.
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  server.close(() => process.exit(0))
})
