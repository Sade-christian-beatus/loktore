import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchAppointments } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'

function isToday(d) {
  const a = new Date(d)
  const n = new Date()
  return (
    a.getFullYear() === n.getFullYear() &&
    a.getMonth() === n.getMonth() &&
    a.getDate() === n.getDate()
  )
}

export default function DoctorDashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const appts = useFetch(fetchAppointments).data || []

  const today = appts.filter((a) => isToday(a.scheduledAt) && a.status !== 'cancelled')
  const pending = appts.filter((a) => a.status === 'pending')
  const patients = new Set(appts.map((a) => a.patientId)).size
  const upcoming = appts
    .filter((a) => new Date(a.scheduledAt) >= new Date() && a.status !== 'cancelled')
    .slice(0, 4)

  const fmt = (d) =>
    new Date(d).toLocaleString(i18n.language === 'fr' ? 'fr-FR' : undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  const cards = [
    { label: t('doctor.today'), value: today.length },
    { label: t('appointments.status.pending'), value: pending.length },
    { label: t('doctor.patients'), value: patients },
  ]

  return (
    <div className="px-4 pt-6">
      <p className="text-sm text-slate-400">{t('doctor.dashboard')}</p>
      <h1 className="text-xl font-bold text-slate-800">
        {user?.fullName || t('nav.profile')}
      </h1>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="card text-center">
            <p className="text-2xl font-bold text-brand-700">{c.value}</p>
            <p className="text-xs text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">{t('doctor.upcoming')}</h2>
        <Link to="/appointments" className="text-sm font-semibold italic text-brand-600">
          {t('doctor.agenda')}
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-slate-400">{t('doctor.noUpcoming')}</p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((a) => (
            <div key={a.id} className="card flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{a.patient?.fullName}</p>
                <p className="text-sm text-slate-500">{fmt(a.scheduledAt)}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {t(`appointments.status.${a.status}`)}
              </span>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/patients"
        className="card mt-4 flex items-center justify-between transition active:bg-slate-50"
      >
        <span className="flex items-center gap-3 text-slate-700">
          <span className="text-xl">👥</span>
          {t('doctor.myPatients')}
        </span>
        <span className="text-slate-300">›</span>
      </Link>
    </div>
  )
}
