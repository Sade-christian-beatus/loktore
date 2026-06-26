import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchOrders, cancelOrder } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'

const statusStyle = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  ready: 'bg-brand-100 text-brand-700',
  completed: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-red-100 text-red-700',
}

export default function MyOrders() {
  const { t, i18n } = useTranslation()
  const [tick, setTick] = useState(0)
  const { data, loading } = useFetch(fetchOrders, [tick])
  const orders = data || []

  async function cancel(id) {
    await cancelOrder(id)
    setTick((n) => n + 1)
  }

  const fmt = (d) =>
    new Date(d).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : undefined, {
      dateStyle: 'medium',
    })

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-slate-800">{t('orders.myOrders')}</h1>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center text-slate-400">
          <span className="text-5xl">🧾</span>
          <p>{t('orders.empty')}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800">{o.facility?.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[o.status]}`}
                >
                  {t(`orders.status.${o.status}`)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{fmt(o.createdAt)}</p>
              <ul className="mt-2 space-y-0.5 text-sm text-slate-600">
                {o.items.map((it) => (
                  <li key={it.id}>
                    {it.quantity} × {it.medication?.name}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`text-xs ${
                    o.payment?.status === 'succeeded' ? 'text-brand-700' : 'text-slate-400'
                  }`}
                >
                  {o.payment?.status === 'succeeded' ? t('payment.paid') : t('payment.unpaid')}
                </span>
                {o.payment?.status !== 'succeeded' && o.status !== 'cancelled' && (
                  <Link
                    to={`/pay/${o.id}`}
                    className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-medium text-white"
                  >
                    {t('payment.pay')}
                  </Link>
                )}
              </div>
              {o.status === 'pending' && (
                <button
                  onClick={() => cancel(o.id)}
                  className="mt-3 w-full rounded-lg border border-red-200 py-1.5 text-sm font-medium text-red-600"
                >
                  {t('orders.cancel')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
