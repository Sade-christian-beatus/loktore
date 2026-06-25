import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchMedicalRecord, updateMedicalRecord } from '../services/resources.js'

const toList = (s) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

export default function MedicalRecord() {
  const { t } = useTranslation()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchMedicalRecord()
      .then((rec) => {
        if (!active) return
        setForm({
          bloodType: rec?.bloodType || '',
          allergies: (rec?.allergies || []).join(', '),
          chronicConditions: (rec?.chronicConditions || []).join(', '),
        })
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  async function save(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      await updateMedicalRecord({
        bloodType: form.bloodType || undefined,
        allergies: toList(form.allergies),
        chronicConditions: toList(form.chronicConditions),
      })
      setMessage(t('record.saved'))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="px-4 pt-10 text-center text-sm text-slate-400">{t('common.loading')}</p>
  }

  if (!form) {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-xl font-bold text-slate-800">{t('record.title')}</h1>
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t('record.demoNotice')}
        </p>
      </div>
    )
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('record.title')}</h1>

      <form onSubmit={save} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t('record.bloodType')}
          </label>
          <input
            type="text"
            className="input"
            placeholder="O+, A-, …"
            maxLength={3}
            value={form.bloodType}
            onChange={set('bloodType')}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t('record.allergies')}
          </label>
          <input
            type="text"
            className="input"
            placeholder={t('record.commaHint')}
            value={form.allergies}
            onChange={set('allergies')}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t('record.chronicConditions')}
          </label>
          <input
            type="text"
            className="input"
            placeholder={t('record.commaHint')}
            value={form.chronicConditions}
            onChange={set('chronicConditions')}
          />
        </div>

        {message && <p className="text-sm text-brand-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? t('common.loading') : t('record.save')}
        </button>
      </form>
    </div>
  )
}
