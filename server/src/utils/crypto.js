// @ts-check
import crypto from 'node:crypto'
import { env } from '../lib/env.js'

// Chiffrement applicatif au repos des données de santé (cf. PLAN §7.4).
// AES-256-GCM : confidentialité + intégrité. Format stocké : iv.tag.ciphertext (base64).
// La clé (32 octets) provient de ENCRYPTION_KEY (hex 64 car. ou base64).

const ALGO = 'aes-256-gcm'
const PREFIX = 'enc:v1:' // marqueur pour distinguer un champ chiffré d'une donnée legacy

function loadKey() {
  const raw = env.encryptionKey
  // Accepte une clé hex (64 car.) ou base64 ; doit faire 32 octets.
  const buf = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, 'hex')
    : Buffer.from(raw, 'base64')
  if (buf.length !== 32) {
    throw new Error('ENCRYPTION_KEY doit représenter 32 octets (hex 64 car. ou base64).')
  }
  return buf
}

const KEY = loadKey()

/**
 * @param {string | null | undefined} plaintext
 * @returns {string | null | undefined}
 */
export function encrypt(plaintext) {
  if (plaintext == null) return plaintext
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, KEY, iv)
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + [iv, tag, enc].map((b) => b.toString('base64')).join('.')
}

/**
 * @param {string | null | undefined} value
 * @returns {string | null | undefined}
 */
export function decrypt(value) {
  if (value == null) return value
  // Tolérance aux données legacy non chiffrées (renvoyées telles quelles).
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return value
  try {
    const [ivB64, tagB64, dataB64] = value.slice(PREFIX.length).split('.')
    const iv = Buffer.from(ivB64, 'base64')
    const tag = Buffer.from(tagB64, 'base64')
    const data = Buffer.from(dataB64, 'base64')
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    return value
  }
}

// Helpers pour tableaux de chaînes (allergies, maladies chroniques).
export const encryptArray = (arr) => (Array.isArray(arr) ? arr.map(encrypt) : arr)
export const decryptArray = (arr) => (Array.isArray(arr) ? arr.map(decrypt) : arr)
