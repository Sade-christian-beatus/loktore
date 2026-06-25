import webpush from 'web-push'
import { prisma } from './prisma.js'

// Configuration Web Push. Si les clés VAPID sont absentes, le push est désactivé
// (l'application fonctionne normalement, sans notifications).
const PUBLIC = process.env.VAPID_PUBLIC_KEY || ''
const PRIVATE = process.env.VAPID_PRIVATE_KEY || ''
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@loktore.bf'

export const pushEnabled = Boolean(PUBLIC && PRIVATE)
export const vapidPublicKey = PUBLIC

if (pushEnabled) {
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE)
}

// Envoie une notification à tous les abonnements d'un utilisateur.
// Supprime automatiquement les abonnements expirés (404/410).
export async function sendToUser(profileId, payload) {
  if (!pushEnabled) return
  const subs = await prisma.pushSubscription.findMany({ where: { profileId } })
  const body = JSON.stringify(payload)
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        )
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {})
        }
      }
    }),
  )
}
