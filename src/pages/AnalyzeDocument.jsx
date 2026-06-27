import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api.js'

const MODES = [
  {
    key: 'prescription',
    icon: '📋',
    label: 'Ordonnance',
    description: 'Photographiez votre ordonnance pour voir les médicaments prescrits et leurs instructions.',
    endpoint: '/analyze/prescription',
  },
  {
    key: 'exam',
    icon: '🩻',
    label: 'Résultat d\'examen',
    description: 'Importez une radio, un scanner ou des résultats de laboratoire pour une explication simple.',
    endpoint: '/analyze/exam',
  },
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = result.split(',')[1]
      resolve({ base64, mimeType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function PrescriptionResult({ data }) {
  if (data.error) return <p className="text-sm text-red-600">{data.error}</p>
  return (
    <div className="space-y-4">
      {data.doctorName && (
        <p className="text-sm text-slate-500">Médecin : <span className="font-medium text-slate-700">{data.doctorName}</span></p>
      )}
      {data.medications?.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-slate-800">Médicaments prescrits</h3>
          <div className="space-y-2">
            {data.medications.map((m, i) => (
              <div key={i} className="rounded-xl border border-brand-100 bg-brand-50 p-3">
                <p className="font-semibold text-brand-800">💊 {m.name}</p>
                {m.dosage && <p className="mt-0.5 text-sm text-slate-600">Dosage : {m.dosage}</p>}
                {m.duration && <p className="text-sm text-slate-600">Durée : {m.duration}</p>}
                {m.instructions && <p className="mt-1 text-sm text-slate-500 italic">{m.instructions}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.notes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">⚠️ À retenir</p>
          <p className="mt-1 text-sm text-amber-700">{data.notes}</p>
        </div>
      )}
    </div>
  )
}

function ExamResult({ data }) {
  if (data.error) return <p className="text-sm text-red-600">{data.error}</p>

  const urgencyColors = {
    urgent: 'border-red-300 bg-red-50',
    attention: 'border-amber-300 bg-amber-50',
    normal: 'border-emerald-200 bg-emerald-50',
  }
  const urgencyIcons = { urgent: '🚨', attention: '⚠️', normal: '✅' }

  return (
    <div className="space-y-4">
      {data.type && (
        <p className="text-sm text-slate-500">Type d'examen : <span className="font-medium text-slate-700">{data.type}</span></p>
      )}
      {data.urgency && (
        <div className={`rounded-xl border p-3 ${urgencyColors[data.urgency] || urgencyColors.normal}`}>
          <p className="text-sm font-semibold">
            {urgencyIcons[data.urgency]} {data.urgency === 'urgent' ? 'Consultation urgente recommandée' : data.urgency === 'attention' ? 'À surveiller' : 'Résultat normal'}
          </p>
        </div>
      )}
      {data.summary && (
        <div>
          <h3 className="mb-1 font-semibold text-slate-800">Explication simple</h3>
          <p className="text-sm leading-relaxed text-slate-600">{data.summary}</p>
        </div>
      )}
      {data.findings?.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-slate-800">Ce que montre l'examen</h3>
          <ul className="space-y-1">
            {data.findings.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600">
                <span className="mt-0.5 shrink-0 text-brand-500">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.recommendation && (
        <div className="rounded-xl bg-brand-50 p-3">
          <p className="text-sm font-medium text-brand-800">Que faire ensuite ?</p>
          <p className="mt-1 text-sm text-brand-700">{data.recommendation}</p>
        </div>
      )}
      <p className="text-xs text-slate-400 italic">
        ⓘ Cette interprétation est indicative et ne remplace pas un avis médical.
      </p>
    </div>
  )
}

export default function AnalyzeDocument() {
  const { t } = useTranslation()
  const [mode, setMode] = useState('prescription')
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const selectedMode = MODES.find((m) => m.key === mode)

  function onFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  async function onAnalyze() {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { base64, mimeType } = await fileToBase64(file)
      const data = await api.post(selectedMode.endpoint, { imageBase64: base64, mimeType })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'analyse. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-bold text-slate-800">Analyse de documents médicaux</h1>
      <p className="mt-1 text-sm text-slate-500">
        Notre IA vous aide à comprendre vos documents de santé en langage simple.
      </p>

      {/* Sélecteur de mode */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); reset() }}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              mode === m.key
                ? 'border-brand-500 bg-brand-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <p className="text-2xl">{m.icon}</p>
            <p className={`mt-2 text-sm font-semibold ${mode === m.key ? 'text-brand-700' : 'text-slate-700'}`}>
              {m.label}
            </p>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">{selectedMode.description}</p>

      {/* Zone d'upload */}
      <div className="mt-5">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileChange}
        />

        {!preview ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 py-10 text-center"
          >
            <span className="text-4xl">📷</span>
            <div>
              <p className="font-semibold text-brand-700">{t('analyze.uploadImage')}</p>
              <p className="mt-0.5 text-xs text-slate-400">JPEG, PNG ou WebP — max 10 Mo</p>
            </div>
          </button>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200">
            <img src={preview} alt="Document" className="w-full object-contain max-h-64" />
            <button
              onClick={reset}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white"
              aria-label="Supprimer"
            >
              ✕
            </button>
          </div>
        )}

        {file && !result && (
          <button
            onClick={onAnalyze}
            disabled={loading}
            className="btn-primary mt-4 w-full py-3.5 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner h-4 w-4" />
                {t('analyze.analyzing')}
              </span>
            ) : (
              `Analyser ce document`
            )}
          </button>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Résultat */}
      {result && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">{t('analyze.result')}</h2>
            <button onClick={reset} className="text-xs text-brand-600 font-medium">Nouvelle analyse</button>
          </div>
          {mode === 'prescription' ? <PrescriptionResult data={result} /> : <ExamResult data={result} />}
        </div>
      )}
    </div>
  )
}
