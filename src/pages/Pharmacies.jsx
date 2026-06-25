import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchFacilities } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'

export default function Pharmacies() {
  const { t } = useTranslation()
  const { data, loading } = useFetch(() => fetchFacilities({ type: 'pharmacy' }))
  const list = data || []

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('orders.pharmacies')}</h1>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {list.map((p) => (
            <Link
              key={p.id}
              to={`/order/${p.id}`}
              className="card flex items-center justify-between transition active:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{p.name}</p>
                <p className="truncate text-xs text-slate-400">{p.address}</p>
              </div>
              <div className="flex items-center gap-2">
                {p.onDuty && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {t('map.onDuty')}
                  </span>
                )}
                <span className="text-slate-300">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
