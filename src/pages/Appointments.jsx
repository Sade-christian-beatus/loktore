import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchAppointments, updateAppointmentStatus } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'

const statusStyle = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-brand-100 text-brand-700',
  cancelled: 'bg-red-100 text-red-700',
  done: 'bg-slate-100 text-slate-500',
}

export default function Appointments() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [tick, setTick] = useState(0)
  const { data, loading } = useFetch(fetchAppointments, [tick])
  const list = data || []

  async function cancel(id) {
    await updateAppointmentStatus(id, 'cancelled')
    setTick((n) => n + 1)
  }

  const fmt = (d) =>
    new Date(d).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('appointments.title')}</h1>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      ) : list.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center text-slate-400">
          <span className="text-5xl">📅</span>
          <p>{t('appointments.empty')}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {list.map((a) => {
            const other =
              user?.role === 'doctor' ? a.patient?.fullName : a.doctor?.fullName
            const canCancel = a.status === 'pending' || a.status === 'confirmed'
            return (
              <div key={a.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{other || '—'}</p>
                    <p className="text-sm text-slate-500">{fmt(a.scheduledAt)}</p>
                    {a.reason && (
                      <p className="mt-1 truncate text-xs text-slate-400">{a.reason}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[a.status]}`}
                  >
                    {t(`appointments.status.${a.status}`)}
                  </span>
                </div>
                {canCancel && (
                  <button
                    onClick={() => cancel(a.id)}
                    className="mt-3 w-full rounded-lg border border-red-200 py-1.5 text-sm font-medium text-red-600"
                  >
                    {t('appointments.cancel')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
