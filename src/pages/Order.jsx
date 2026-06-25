import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchFacilityMedications, createOrder } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'

export default function Order() {
  const { facilityId } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, loading } = useFetch(() => fetchFacilityMedications(facilityId), [facilityId])
  const meds = (data || []).filter((m) => m.inStock)
  const [qty, setQty] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const setQuantity = (id, v) => setQty((q) => ({ ...q, [id]: Math.max(0, v) }))
  const items = Object.entries(qty)
    .filter(([, q]) => q > 0)
    .map(([medicationId, quantity]) => ({ medicationId, quantity }))
  const total = meds.reduce((s, m) => s + (qty[m.id] || 0) * (m.price || 0), 0)

  async function submit() {
    setError('')
    setSubmitting(true)
    try {
      await createOrder({ facilityId, items })
      navigate('/orders')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <header className="mb-4 flex items-center gap-2">
        <Link to="/pharmacies" aria-label="Retour" className="text-2xl text-slate-400">
          ‹
        </Link>
        <h1 className="text-xl font-bold text-slate-800">{t('orders.newOrder')}</h1>
      </header>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      ) : meds.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-400">{t('orders.noProducts')}</p>
      ) : (
        <div className="space-y-2">
          {meds.map((m) => (
            <div key={m.id} className="card flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{m.name}</p>
                <p className="text-xs text-slate-400">
                  {m.price != null ? `${m.price.toLocaleString('fr-FR')} ${t('common.currency')}` : '—'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(m.id, (qty[m.id] || 0) - 1)}
                  className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-slate-600"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm">{qty[m.id] || 0}</span>
                <button
                  onClick={() => setQuantity(m.id, (qty[m.id] || 0) + 1)}
                  className="grid h-7 w-7 place-items-center rounded-full border border-brand-200 text-brand-700"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md px-4 pb-4">
          <button
            onClick={submit}
            disabled={submitting}
            className="btn-primary w-full justify-between"
          >
            <span>{t('orders.placeOrder')}</span>
            <span>
              {total.toLocaleString('fr-FR')} {t('common.currency')}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
