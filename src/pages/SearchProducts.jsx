import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api.js'
import { useFetch } from '../hooks/useFetch.js'

export default function SearchProducts() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const fetcher = useCallback(
    () => (submitted ? api.get(`/medications/search?q=${encodeURIComponent(submitted)}`) : Promise.resolve(null)),
    [submitted],
  )
  const { data, loading } = useFetch(fetcher)

  function onSubmit(e) {
    e.preventDefault()
    setSubmitted(query.trim())
  }

  const results = data || []

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-bold text-slate-800">{t('search.products')}</h1>

      {/* Barre de recherche */}
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-2.5 shadow-sm focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <button type="submit" className="btn-primary px-4 rounded-2xl text-sm" disabled={!query.trim()}>
          {t('doctors.all') === 'Tous' ? 'Chercher' : '›'}
        </button>
      </form>

      {/* Résultats */}
      <div className="mt-5">
        {loading && (
          <div className="flex justify-center py-8">
            <span className="spinner" />
          </div>
        )}

        {!loading && submitted && results.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-4xl">💊</p>
            <p className="mt-2 font-medium text-slate-600">{t('search.noResults')}</p>
            <p className="mt-1 text-sm text-slate-400">Vérifiez l'orthographe ou essayez un autre nom.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="mb-3 text-sm text-slate-500">
              {results.length} résultat{results.length > 1 ? 's' : ''} pour «&nbsp;{submitted}&nbsp;»
            </p>
            <div className="space-y-3">
              {results.map((med) => (
                <div key={med.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">{med.name}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{med.facility?.name}</p>
                      {med.facility?.address && (
                        <p className="truncate text-xs text-slate-400">{med.facility.address}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {med.price != null && (
                        <span className="font-bold text-brand-700">
                          {med.price.toLocaleString('fr-FR')} {t('common.currency')}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          med.inStock
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {med.inStock ? t('search.inStock') : t('search.outOfStock')}
                      </span>
                      {med.facility?.onDuty && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                          De garde
                        </span>
                      )}
                    </div>
                  </div>
                  {med.inStock && med.facility?.id && (
                    <Link
                      to={`/order/${med.facility.id}`}
                      className="mt-3 block rounded-xl bg-brand-600 py-2 text-center text-sm font-semibold text-white active:bg-brand-700"
                    >
                      Commander chez {med.facility.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA mode démo */}
        {!loading && !submitted && (
          <div className="mt-12 text-center">
            <p className="text-5xl">🔍</p>
            <p className="mt-3 font-semibold text-slate-700">Recherchez un médicament</p>
            <p className="mt-1 text-sm text-slate-400">
              Comparez disponibilité et prix dans toutes les pharmacies partenaires.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
