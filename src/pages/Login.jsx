import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth.js'
import i18n from '../i18n/config.js'

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'moore', label: 'Mooré' },
  { code: 'jula', label: 'Jula' },
]

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ identifier, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function changeLanguage(code) {
    i18n.changeLanguage(code)
    localStorage.setItem('loktore.lang', code)
  }

  const currentLang = i18n.language || 'fr'

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      {/* Hero vert */}
      <div className="relative flex flex-col bg-brand-500 px-6 pb-10 pt-12">
        {/* Logo + nom */}
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/20 text-white font-bold text-lg">+</span>
          <span className="text-xl font-bold text-white">{t('app.name')}</span>
        </div>
        {/* Tagline */}
        <h1 className="mt-6 text-3xl font-extrabold leading-tight text-white">
          Votre santé,<br />à portée de main.
        </h1>
        <p className="mt-2 text-sm text-white/80">
          Rendez-vous, dossier médical et pharmacies de garde — où que vous soyez.
        </p>
      </div>

      {/* Carte blanche */}
      <div className="flex-1 rounded-t-3xl bg-white px-6 pt-7 pb-10 -mt-5 shadow-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">{t('login.title')}</h2>

          {/* Champ téléphone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              {t('login.phone')}
            </label>
            <div className="flex items-center gap-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
              {/* Préfixe +226 */}
              <div className="flex items-center gap-1.5 border-r border-slate-200 px-3 py-3">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.63 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.95 5.95l.77-.77a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span className="text-sm font-semibold text-slate-700">+226</span>
              </div>
              <input
                type="tel"
                autoComplete="username tel"
                placeholder="70 12 34 56"
                className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Champ mot de passe */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-600">{t('login.password')}</label>
              <button type="button" className="text-xs font-semibold text-brand-600">
                {t('login.forgotPassword')}
              </button>
            </div>
            <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
              <div className="pl-3 pr-1 py-3 text-slate-400">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-slate-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-3 py-3 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={loading}>
            {loading ? t('common.loading') : t('login.submit')}
          </button>

          <div className="flex items-center gap-3 text-slate-300">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-slate-400">ou</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 py-3.5 text-sm font-semibold text-brand-600 hover:border-brand-300"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {t('login.smsCode')}
          </button>

          <p className="text-center text-sm text-slate-500">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="font-semibold text-brand-600">
              {t('login.register')}
            </Link>
          </p>

          {/* Sélecteur de langue */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {LANGS.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  currentLang === lang.code
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  )
}
