import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchOrders, payOrder, confirmPayment } from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'

const providers = [
  { id: 'orange', label: 'Orange Money' },
  { id: 'moov', label: 'Moov Money' },
]

export default function Payment() {
  const { orderId } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, loading } = useFetch(fetchOrders)
  const order = (data || []).find((o) => o.id === orderId)

  const [phone, setPhone] = useState('')
  const [provider, setProvider] = useState('orange')
  const [payment, setPayment] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const amount = order
    ? order.items.reduce((s, it) => s + (it.priceAtOrder || 0) * it.quantity, 0)
    : 0

  async function initiate(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      setPayment(await payOrder(orderId, { phone, provider }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    setError('')
    setBusy(true)
    try {
      const res = await confirmPayment(payment.id)
      if (res.status === 'succeeded') navigate('/orders')
      else setError(t('payment.failed'))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pt-6">
      <header className="mb-4 flex items-center gap-2">
        <Link to="/orders" aria-label="Retour" className="text-2xl text-slate-400">
          ‹
        </Link>
        <h1 className="text-xl font-bold text-slate-800">{t('payment.title')}</h1>
      </header>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      ) : !order ? (
        <p className="text-sm text-slate-400">{t('orders.empty')}</p>
      ) : (
        <>
          <div className="card mb-4 flex items-center justify-between">
            <span className="text-slate-600">{order.facility?.name}</span>
            <span className="text-lg font-bold text-brand-700">
              {amount.toLocaleString('fr-FR')} {t('common.currency')}
            </span>
          </div>

          {!payment ? (
            <form onSubmit={initiate} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {providers.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      provider === p.id
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  {t('payment.phone')}
                </label>
                <input
                  type="tel"
                  className="input"
                  placeholder="70 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? t('common.loading') : t('payment.pay')}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {t('payment.confirmPrompt')}
              </p>
              <p className="text-xs text-slate-400">
                {t('payment.reference')} : {payment.reference}
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button onClick={confirm} className="btn-primary w-full" disabled={busy}>
                {busy ? t('common.loading') : t('payment.confirm')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
