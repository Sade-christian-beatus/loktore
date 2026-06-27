import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { env } from '../lib/env.js'
import { logger } from '../lib/logger.js'

const router = Router()
router.use(requireAuth)
router.use(requireRole('patient'))

const imageSchema = z.object({
  imageBase64: z.string().min(1, 'Image requise'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif'], {
    errorMap: () => ({ message: 'Format accepté : JPEG, PNG, WebP ou GIF' }),
  }),
})

async function callClaude(systemPrompt, userText, imageBase64, mimeType) {
  if (!env.anthropicApiKey) {
    throw Object.assign(new Error('Analyse IA non configurée sur ce serveur.'), { status: 503 })
  }
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: userText },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    logger.error({ status: response.status, err }, 'Erreur API Claude')
    throw Object.assign(new Error('Erreur lors de l'analyse. Réessayez.'), { status: 502 })
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

// POST /analyze/prescription — extrait les médicaments d'une ordonnance
router.post('/prescription', validate(imageSchema), async (req, res, next) => {
  try {
    const { imageBase64, mimeType } = req.body
    const system = `Tu es un assistant médical au service de patients au Burkina Faso.
Tu analyses des ordonnances médicales et extrais les informations de façon claire et simple.
Tu réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "medications": [
    { "name": "Nom du médicament", "dosage": "Dosage", "duration": "Durée", "instructions": "Instructions" }
  ],
  "doctorName": "Nom du médecin si lisible",
  "date": "Date si lisible",
  "notes": "Remarques importantes pour le patient (en français simple)"
}
Si l'image n'est pas une ordonnance médicale, réponds avec : { "error": "Ce document ne semble pas être une ordonnance." }`

    const text = await callClaude(system, 'Analyse cette ordonnance médicale.', imageBase64, mimeType)

    let result
    try {
      result = JSON.parse(text)
    } catch {
      result = { notes: text }
    }

    res.json(result)
  } catch (err) {
    next(err)
  }
})

// POST /analyze/exam — interprétation simple d'un examen médical (scanner, radio, résultats)
router.post('/exam', validate(imageSchema), async (req, res, next) => {
  try {
    const { imageBase64, mimeType } = req.body
    const system = `Tu es un assistant médical pédagogique au service de patients au Burkina Faso.
Tu analyses des documents médicaux (radios, scanners, résultats de laboratoire) et fournis une EXPLICATION SIMPLE destinée au patient, sans jargon médical.
Règles importantes :
- Explique ce que montre le document en termes simples
- Si tu vois quelque chose d'anormal ou potentiellement grave, dis clairement que le patient doit consulter un médecin
- Ne pose JAMAIS de diagnostic définitif
- Réponds en JSON valide avec cette structure :
{
  "type": "Type d'examen détecté (radio, scanner, analyse de sang, etc.)",
  "summary": "Résumé simple pour le patient",
  "findings": ["Observation 1", "Observation 2"],
  "recommendation": "Ce que le patient devrait faire ensuite",
  "urgency": "normal | attention | urgent"
}
Si ce n'est pas un document médical, réponds : { "error": "Ce document ne semble pas être un examen médical." }`

    const text = await callClaude(
      system,
      'Analyse ce document médical et explique-le de façon simple pour le patient.',
      imageBase64,
      mimeType,
    )

    let result
    try {
      result = JSON.parse(text)
    } catch {
      result = { summary: text }
    }

    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
