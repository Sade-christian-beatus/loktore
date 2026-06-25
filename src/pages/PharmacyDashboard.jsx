import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth.js'
import {
  fetchPharmacyMedications,
  createMedication,
  updateMedication,
  deleteMedication,
} from '../services/resources.js'
import { useFetch } from '../hooks/useFetch.js'

export default function PharmacyDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tick, setTick] = useState(0)
  const { data, loading } = useFetch(fetchPharmacyMedications, [tick])
  const meds = data || []
  const [form, setForm] = useState({ name: '', price: '' })
  const [error, setError] = useState('')
  const refresh = () => setTick((n) => n + 1)

  async function add(e) {
    e.preventDefault()
    setError('')
    try {
      await createMedication({
        name: form.name,
        price: form.price ? Number(form.price) : undefined,
        inStock: true,
      })
      setForm({ name: '', price: '' })
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleStock(m) {
    await updateMedication(m.id, { inStock: !m.inStock })
    refresh()
  }

  async function remove(id) {
    await deleteMedication(id)
    refresh()
  }

  const inStockCount = meds.filter((m) => m.inStock).length

  return (
    <div className="px-4 pt-6">
      <p className="text-sm text-slate-400">{t('pharmacy.dashboard')}</p>
      <h1 className="text-xl font-bold text-slate-800">{user?.fullName}</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-brand-700">{meds.length}</p>
          <p className="text-xs text-slate-500">{t('pharmacy.products')}</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-brand-700">{inStockCount}</p>
          <p className="text-xs text-slate-500">{t('pharmacy.inStock')}</p>
        </div>
      </div>

      <form onSubmit={add} className="card mt-4 space-y-3">
        <p className="text-sm font-medium text-slate-600">{t('pharmacy.addProduct')}</p>
        <input
          className="input py-2"
          placeholder={t('pharmacy.name')}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="input py-2"
          type="number"
          min="0"
          placeholder={`${t('pharmacy.price')} (${t('common.currency')})`}
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full py-2">
          {t('pharmacy.add')}
        </button>
      </form>

      <h2 className="mb-2 mt-6 font-semibold text-slate-800">{t('pharmacy.catalog')}</h2>
      {loading ? (
        <div className="mt-6 flex justify-center">
          <span className="spinner" />
        </div>
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
              <button
                onClick={() => toggleStock(m)}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  m.inStock ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {m.inStock ? t('pharmacy.available') : t('pharmacy.outOfStock')}
              </button>
              <button
                onClick={() => remove(m.id)}
                aria-label={t('pharmacy.remove')}
                className="text-slate-300"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
