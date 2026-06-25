import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth.js'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-700 text-3xl text-white">
          ✚
        </div>
        <h1 className="text-2xl font-bold text-brand-800">{t('app.name')}</h1>
        <p className="mt-1 text-slate-500">{t('app.tagline')}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">{t('login.title')}</h2>
        <p className="-mt-2 text-sm text-slate-500">{t('login.subtitle')}</p>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t('login.email')}
          </label>
          <input
            type="text"
            autoComplete="username"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            {t('login.password')}
          </label>
          <input
            type="password"
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? t('common.loading') : t('login.submit')}
        </button>

        <p className="text-center text-sm text-slate-500">
          {t('login.noAccount')}{' '}
          <button type="button" className="font-medium text-brand-700">
            {t('login.register')}
          </button>
        </p>

        <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
          {t('login.demoHint')}
        </p>
      </form>
    </div>
  )
}
