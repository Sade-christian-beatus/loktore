import http from 'node:http'
import { Server as SocketServer } from 'socket.io'

import { env } from './lib/env.js'
import { prisma } from './lib/prisma.js'
import { logger } from './lib/logger.js'
import { verifyAccessToken } from './utils/jwt.js'
import { createApp } from './app.js'
import { getMemberConversation } from './routes/conversations.js'
import { startScheduler } from './services/africanReports/scheduler.js'

const app = createApp()
const server = http.createServer(app)
const io = new SocketServer(server, { cors: { origin: env.corsOrigin } })
app.set('io', io)

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
  socket.on('conversation:join', async (conversationId) => {
    const conv = await getMemberConversation(conversationId, socket.user.sub)
    if (conv) socket.join(`conv:${conversationId}`)
  })
})

server.listen(env.port, () => {
  logger.info({ port: env.port, env: env.nodeEnv }, `API Loktoré démarrée sur le port ${env.port}`)
  // Lance la collecte automatique des rapports africains (toutes les 6h)
  startScheduler()
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  server.close(() => process.exit(0))
})
