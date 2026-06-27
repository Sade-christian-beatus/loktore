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

      {/* Raccourci recherche médicament */}
      <Link
        to="/search-products"
        className="mt-3 flex items-center gap-3 rounded-2xl bg-brand-50 border border-brand-200 px-4 py-3"
      >
        <span className="text-2xl">🔍</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-700 text-sm">Rechercher un médicament</p>
          <p className="text-xs text-slate-500 truncate">Comparez disponibilité et prix dans toutes les pharmacies</p>
        </div>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-brand-400" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </Link>

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
