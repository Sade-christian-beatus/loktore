import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createAppointment } from '../services/resources.js'

// Modal de prise de rendez-vous avec un médecin.
export default function BookingModal({ doctor, onClose, onBooked }) {
  const { t } = useTranslation()
  const [when, setWhen] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createAppointment({
        doctorId: doctor.id,
        scheduledAt: new Date(when).toISOString(),
        reason: reason || undefined,
      })
      onBooked?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{t('booking.title')}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-2xl text-slate-400">
            ×
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          {doctor.title} {doctor.fullName} ·{' '}
          <span className="text-brand-600">{t(`categories.${doctor.speciality}`)}</span>
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              {t('booking.datetime')}
            </label>
            <input
              type="datetime-local"
              className="input"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              {t('booking.reason')}
            </label>
            <input
              type="text"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading || !when}>
            {loading ? t('common.loading') : t('booking.confirm')}
          </button>
        </form>
      </div>
    </div>
  )
}
