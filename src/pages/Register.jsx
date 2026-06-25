import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth.js'

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-6 text-center">
        <img src="/logo.svg" alt="Loktoré" className="mx-auto mb-2 h-20 w-auto" />
        <p className="text-slate-500">{t('app.tagline')}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">{t('register.title')}</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t('register.fullName')}
          </label>
          <input
            type="text"
            autoComplete="name"
            className="input"
            value={form.fullName}
            onChange={set('fullName')}
            required
            minLength={2}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t('login.email')}
          </label>
          <input
            type="email"
            autoComplete="email"
            className="input"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t('login.password')}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            className="input"
            value={form.password}
            onChange={set('password')}
            required
            minLength={8}
          />
          <p className="mt-1 text-xs text-slate-400">{t('register.passwordHint')}</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t('common.loading') : t('register.submit')}
        </button>

        <p className="text-center text-sm text-slate-500">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-brand-700">
            {t('login.title')}
          </Link>
        </p>
      </form>
    </div>
  )
}
