// @ts-check
import jwt from 'jsonwebtoken'
import { env } from '../lib/env.js'

/**
 * @typedef {{ sub: string; role: string; email?: string; exp: number; iat: number }} JwtPayload
 */

/**
 * @param {{ id: string; role: string; email: string }} profile
 * @returns {string}
 */
export function signAccessToken(profile) {
  return jwt.sign(
    { sub: profile.id, role: profile.role, email: profile.email },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessTtl },
  )
}

/**
 * @param {{ id: string; role: string }} profile
 * @returns {string}
 */
export function signRefreshToken(profile) {
  return jwt.sign({ sub: profile.id }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshTtl,
  })
}

/**
 * @param {string} token
 * @returns {JwtPayload}
 */
export function verifyAccessToken(token) {
  return /** @type {JwtPayload} */ (jwt.verify(token, env.jwt.accessSecret))
}

/**
 * @param {string} token
 * @returns {JwtPayload}
 */
export function verifyRefreshToken(token) {
  return /** @type {JwtPayload} */ (jwt.verify(token, env.jwt.refreshSecret))
}
