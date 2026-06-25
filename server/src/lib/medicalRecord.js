import { prisma } from './prisma.js'
import { encrypt, decrypt, encryptArray, decryptArray } from '../utils/crypto.js'

// Helpers partagés du dossier médical : chiffrement au repos + journalisation.
// Utilisés par l'accès patient (routes/me.js) et l'accès médecin sous consentement.

export function encodeForStorage(body) {
  const data = {}
  if (body.bloodType !== undefined) data.bloodType = encrypt(body.bloodType)
  if (body.allergies !== undefined) data.allergies = encryptArray(body.allergies)
  if (body.chronicConditions !== undefined) {
    data.chronicConditions = encryptArray(body.chronicConditions)
  }
  if (body.history !== undefined) {
    data.history = body.history == null ? null : { __enc: encrypt(JSON.stringify(body.history)) }
  }
  return data
}

export function decodeRecord(rec) {
  let history = rec.history
  if (history && history.__enc) {
    try {
      history = JSON.parse(decrypt(history.__enc))
    } catch {
      history = null
    }
  }
  return {
    ...rec,
    bloodType: decrypt(rec.bloodType),
    allergies: decryptArray(rec.allergies),
    chronicConditions: decryptArray(rec.chronicConditions),
    history,
  }
}

// Journalise un accès au dossier (best-effort, ne bloque pas la réponse).
export function logAccess(actorId, patientId, action) {
  return prisma.medicalAccessLog
    .create({ data: { actorId, patientId, action } })
    .catch(() => {})
}
