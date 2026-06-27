import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

import { env } from './lib/env.js'
import { httpLogger } from './lib/logger.js'
import { errorHandler, notFound } from './middleware/error.js'

import authRouter from './routes/auth.js'
import meRouter from './routes/me.js'
import appointmentsRouter from './routes/appointments.js'
import directoryRouter from './routes/directory.js'
import adminRouter from './routes/admin.js'
import pharmacyRouter from './routes/pharmacy.js'
import ordersRouter from './routes/orders.js'
import paymentsRouter from './routes/payments.js'
import pushRouter from './routes/push.js'
import consentsRouter from './routes/consents.js'
import recordsRouter from './routes/records.js'
import conversationsRouter from './routes/conversations.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.corsOrigin, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(httpLogger)

  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })

  app.get('/health', (req, res) => res.json({ status: 'ok' }))

  const api = express.Router()
  api.use('/auth', authLimiter, authRouter)
  api.use('/me', meRouter)
  api.use('/appointments', appointmentsRouter)
  api.use('/conversations', conversationsRouter)
  api.use('/admin', adminRouter)
  api.use('/pharmacy', pharmacyRouter)
  api.use('/orders', ordersRouter)
  api.use('/payments', paymentsRouter)
  api.use('/push', pushRouter)
  api.use('/consents', consentsRouter)
  api.use('/patients', recordsRouter)
  api.use('/', directoryRouter)
  app.use('/api/v1', api)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
