import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchPatientRecord } from '../services/resources.js'

function Field({ label, value }) {
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-slate-800">{value || '—'}</p>
    </div>
  )
}

export default function PatientRecord() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchPatientRecord(id)
      .then((r) => active && setRecord(r))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  return (
    <div className="px-4 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <Link to="/patients" aria-label="Retour" className="text-2xl text-slate-400">
          ‹
        </Link>
        <h1 className="text-xl font-bold text-slate-800">{t('record.title')}</h1>
      </header>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      ) : error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      ) : (
        <div className="space-y-3">
          <Field label={t('record.bloodType')} value={record.bloodType} />
          <Field label={t('record.allergies')} value={(record.allergies || []).join(', ')} />
          <Field
            label={t('record.chronicConditions')}
            value={(record.chronicConditions || []).join(', ')}
          />
          <p className="px-1 text-xs text-slate-400">{t('consent.accessLogged')}</p>
        </div>
      )}
    </div>
  )
}
