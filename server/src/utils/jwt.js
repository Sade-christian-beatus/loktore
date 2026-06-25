import jwt from 'jsonwebtoken'
import { env } from '../lib/env.js'

export function signAccessToken(profile) {
  return jwt.sign(
    { sub: profile.id, role: profile.role, email: profile.email },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessTtl },
  )
}

export function signRefreshToken(profile) {
  return jwt.sign({ sub: profile.id }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshTtl,
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret)
}
