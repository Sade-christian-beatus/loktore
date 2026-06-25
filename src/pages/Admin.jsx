import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { fetchAdminStats, fetchAdminUsers } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../hooks/useAuth.js'

export default function Admin() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const stats = useFetch(fetchAdminStats).data
  const usersData = useFetch(fetchAdminUsers).data
  const users = usersData?.users || []

  // Garde-fou côté client (le backend reste l'autorité : routes en requireRole('admin')).
  if (user && user.role !== 'admin') return <Navigate to="/" replace />

  const cards = [
    { key: 'patients', value: stats?.patients },
    { key: 'doctors', value: stats?.doctors },
    { key: 'facilities', value: stats?.facilities },
    { key: 'appointments', value: stats?.appointments },
  ]

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('admin.title')}</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.key} className="card text-center">
            <p className="text-2xl font-bold text-brand-700">{c.value ?? '—'}</p>
            <p className="text-xs text-slate-500">{t(`admin.${c.key}`)}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-6 font-semibold text-slate-800">{t('admin.users')}</h2>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="card flex items-center justify-between py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{u.fullName}</p>
              <p className="truncate text-xs text-slate-400">{u.email}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {u.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
