import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchConsents, decideConsent } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'

const statusStyle = {
  pending: 'bg-amber-100 text-amber-700',
  granted: 'bg-brand-100 text-brand-700',
  revoked: 'bg-slate-100 text-slate-500',
}

export default function Consents() {
  const { t } = useTranslation()
  const [tick, setTick] = useState(0)
  const { data, loading } = useFetch(fetchConsents, [tick])
  const list = data || []

  async function decide(id, status) {
    await decideConsent(id, status)
    setTick((n) => n + 1)
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('consent.title')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('consent.subtitle')}</p>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      ) : list.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-400">{t('consent.empty')}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {list.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800">{c.doctor?.fullName}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[c.status]}`}
                >
                  {t(`consent.status.${c.status}`)}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                {c.status !== 'granted' && (
                  <button
                    onClick={() => decide(c.id, 'granted')}
                    className="flex-1 rounded-lg bg-brand-600 py-1.5 text-sm font-medium text-white"
                  >
                    {t('consent.grant')}
                  </button>
                )}
                {c.status === 'granted' && (
                  <button
                    onClick={() => decide(c.id, 'revoked')}
                    className="flex-1 rounded-lg border border-red-200 py-1.5 text-sm font-medium text-red-600"
                  >
                    {t('consent.revoke')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
